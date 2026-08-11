#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    net::{SocketAddr, TcpStream},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::{Duration, Instant},
};

use tauri::{Manager, State};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const BACKEND_JAR_BYTES: &[u8] = include_bytes!("../resources/backend/galtek-one-back.jar");
const BACKEND_ADDRESS: &str = "127.0.0.1:18080";

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

struct BackendProcess(Mutex<Option<Child>>);

fn write_backend_jar(app_data_dir: &std::path::Path) -> Result<(PathBuf, bool), Box<dyn std::error::Error>> {
    let backend_dir = app_data_dir.join("backend");
    std::fs::create_dir_all(&backend_dir)?;

    let backend_jar = backend_dir.join("galtek-one-back.jar");
    let needs_write = match std::fs::metadata(&backend_jar) {
        Ok(meta) => meta.len() as usize != BACKEND_JAR_BYTES.len(),
        Err(_) => true,
    };

    if needs_write {
        std::fs::write(&backend_jar, BACKEND_JAR_BYTES)?;
    }

    Ok((backend_jar, needs_write))
}

fn wait_for_backend() -> Result<Duration, Box<dyn std::error::Error>> {
    let address: SocketAddr = BACKEND_ADDRESS.parse()?;
    let start_time = Instant::now();
    let deadline = start_time + Duration::from_secs(120);

    while Instant::now() < deadline {
        if TcpStream::connect_timeout(&address, Duration::from_millis(350)).is_ok() {
            thread::sleep(Duration::from_millis(700));
            return Ok(start_time.elapsed());
        }

        thread::sleep(Duration::from_millis(250));
    }

    Err(format!("Galtek One backend did not become ready on {BACKEND_ADDRESS}").into())
}

fn backend_is_running() -> bool {
    let Ok(address) = BACKEND_ADDRESS.parse::<SocketAddr>() else {
        return false;
    };

    TcpStream::connect_timeout(&address, Duration::from_millis(250)).is_ok()
}

fn start_backend(app: &tauri::AppHandle, state: State<'_, BackendProcess>) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&app_data_dir)?;

    let (backend_jar, jar_written) = write_backend_jar(&app_data_dir)?;

    if backend_is_running() {
        return Ok(());
    }

    let bundled_java = app
        .path()
        .resource_dir()
        .ok()
        .map(|resource_dir| resource_dir.join("resources").join("jre").join("bin").join("javaw.exe"));

    let java_executable = bundled_java
        .filter(|java| java.exists())
        .unwrap_or_else(|| PathBuf::from("javaw"));

    let log_path = app_data_dir.join("backend.log");
    let mut log_file = std::fs::OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&log_path)?;

    use std::io::Write;
    let _ = writeln!(
        log_file,
        "[GALTEK LAUNCH LOG] Executable: {:?} | JAR re-written: {} | JIT Flags: -XX:TieredStopAtLevel=1",
        java_executable, jar_written
    );

    let stdout_stdio = log_file.try_clone().map(Stdio::from).unwrap_or_else(|_| Stdio::null());
    let stderr_stdio = Stdio::from(log_file);

    let mut command = Command::new(java_executable);
    command
        .arg("-XX:TieredStopAtLevel=1")
        .arg("-jar")
        .arg(backend_jar)
        .arg("--spring.profiles.active=desktop")
        .current_dir(&app_data_dir)
        .stdin(Stdio::null())
        .stdout(stdout_stdio)
        .stderr(stderr_stdio);

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let child = command.spawn()?;

    *state.0.lock().expect("backend process lock") = Some(child);

    let elapsed = wait_for_backend()?;
    println!("[GALTEK TAURI] Backend listo en {:.2}s", elapsed.as_secs_f64());

    Ok(())
}

fn stop_backend(state: State<'_, BackendProcess>) {
    if let Some(mut child) = state.0.lock().expect("backend process lock").take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let state = app.state::<BackendProcess>();
            start_backend(&app.handle(), state)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, tauri::WindowEvent::CloseRequested { .. }) {
                let state = window.state::<BackendProcess>();
                stop_backend(state);
            }
        })
        .run(tauri::generate_context!())
        .expect("error running Galtek One");
}
