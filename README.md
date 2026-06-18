# Galtek One

Aplicacion de punto de venta de escritorio para Windows, construida con React, Java Spring Boot, SQLite y Tauri.

## Estructura del repositorio

- `galtek-one-front/`: frontend React y aplicacion desktop Tauri.
- `galtek-one-back/`: backend Spring Boot.
- `database-setup.ps1`: crea o actualiza la base SQLite local.
- `build-desktop.ps1`: compila backend, frontend, Tauri e incluye un JRE portable para distribuir la app sin depender de Java instalado.
- `galtek-one-schema.sql` y `galtek-one-seed.sql`: scripts versionados de base de datos.

## Requisitos para un equipo nuevo

Instalar en Windows 10/11:

- Java JDK 21.
- Node.js con npm.
- Rust/Cargo.
- Visual Studio Build Tools 2022 con el workload de C++.

Comandos sugeridos con `winget`:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id EclipseAdoptium.Temurin.21.JDK -e
winget install --id Rustlang.Rustup -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Despues de instalar Rust o Build Tools, cerrar y abrir de nuevo la terminal para refrescar el `PATH`.

## Primer arranque despues de clonar

Desde la raiz del repo:

```powershell
cd galtek-one-front
npm ci
Copy-Item .env.example .env
```

Compilar el backend una primera vez:

```powershell
cd ..\galtek-one-back
.\mvnw.cmd -DskipTests package
```

Crear o actualizar la base SQLite local:

```powershell
cd ..
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\database-setup.ps1
```

La base queda por defecto en:

```text
%APPDATA%\GaltekOne\galtek-one.db
```

## Desarrollo local

Levantar backend:

```powershell
cd galtek-one-back
.\mvnw.cmd -DskipTests package
java -Dspring.profiles.active=desktop -jar target\galtek-one-back-0.0.1.jar
```

En otra terminal, levantar frontend:

```powershell
cd galtek-one-front
npm start
```

El backend escucha en:

```text
http://127.0.0.1:18080/GaltekOne
```

## Build desktop independiente

Desde la raiz:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-desktop.ps1
```

El script hace lo siguiente:

- Instala dependencias frontend con `npm ci` si falta `node_modules/react-scripts`.
- Descarga un JRE 21 portable en `galtek-one-front\src-tauri\resources\jre` si no existe.
- Compila el backend y copia el JAR a `galtek-one-front\src-tauri\resources\backend`.
- Compila React.
- Compila Tauri y genera el instalador NSIS.

Entregables principales:

```text
galtek-one-front\src-tauri\target\release\galtek-one.exe
galtek-one-front\src-tauri\target\release\bundle\nsis\Galtek One_0.1.0_x64-setup.exe
```

Si se crea una carpeta portable, el `.exe` debe viajar junto con su carpeta `resources`; para usuarios finales se recomienda usar el instalador.

## Archivos que no se suben

El `.gitignore` excluye dependencias, builds, bases locales y binarios generados:

- `.env` y archivos locales de ambiente.
- `node_modules/`, `build/`, `.cache/`.
- `target/` de Maven/Rust.
- `galtek-one-front/src-tauri/resources/backend/*.jar`.
- `galtek-one-front/src-tauri/resources/jre/`.
- `dist-desktop/`, instaladores, `.exe`, `.zip` y otros paquetes.
- Bases SQLite locales y logs.

Si un desarrollador clona desde cero, debe regenerar esos archivos con los scripts anteriores.

## Notas

- `package-lock.json`, `Cargo.lock`, `.env.example`, scripts SQL y Maven Wrapper si se versionan.
- La app desktop inicia el backend automaticamente al abrirse.
- El instalador generado por `build-desktop.ps1` incluye JRE portable, asi que no requiere Java instalado en la maquina destino.
- Para omitir el JRE embebido durante pruebas, usar `.\build-desktop.ps1 -SkipJreBundle`; ese build si requerira Java en el sistema destino.
