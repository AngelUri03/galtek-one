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
npm install
npm run setup
```

`npm run setup` hace lo necesario para dejar el proyecto listo:

- Instala dependencias del frontend si faltan.
- Crea `galtek-one-front\.env` desde `.env.example` si no existe.
- Crea o actualiza la base SQLite local. Si la base no existe, tambien carga datos demo iniciales.
- Compila el backend.

La base queda por defecto en:

```text
%APPDATA%\GaltekOne\galtek-one.db
```

## Desarrollo local desde la raiz

Levantar todo para verlo en la web:

```powershell
npm run dev
```

Tambien puedes usar:

```powershell
npm start
```

Ambos comandos preparan `.env`, preparan la base y dejan corriendo backend + frontend en la misma terminal.
Si la base ya existe, estos comandos no vuelven a cargar el seed demo para no pisar datos capturados durante desarrollo.

URLs locales:

```text
Frontend web: http://localhost:3000
Backend API:  http://127.0.0.1:18080/GaltekOne
```

Levantar piezas por separado, usando terminales separadas para backend y frontend:

```powershell
npm run db
npm run back
npm run front
```

Para recargar datos demo de forma intencional:

```powershell
npm run db:seed
```

Ese comando puede reemplazar datos demo con IDs fijos; usalo solo cuando quieras refrescar la base de pruebas.

Comandos utiles:

```powershell
npm run front:build
npm run back:build
npm run back:start
npm run build
```

`npm run back:start` ejecuta el JAR ya compilado; si no existe, corre primero `npm run back:build`.

## Build desktop independiente

Desde la raiz:

```powershell
npm run desktop:build
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

Comandos relacionados:

```powershell
npm run exe:build
npm run exe:run
npm run exe:build-run
npm run installer:build
npm run desktop:dev
```

`npm run exe:run` abre el ejecutable generado mas reciente que encuentre. `npm run exe:build-run` compila y despues lo abre.

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
