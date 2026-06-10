# Galtek One

Aplicacion de punto de venta de escritorio para Windows, construida con React, Java Spring Boot, SQLite y Tauri.

## Requisitos para desarrollo

- Windows 10/11.
- Java JDK 21 disponible en `PATH`.
- Node.js y npm.
- Rust/Cargo para compilar Tauri.
- Toolchain de compilacion de Windows para Rust/Tauri, si el equipo no lo tiene instalado.

## Primer arranque despues de clonar

1. Instalar dependencias del frontend:

```powershell
cd galtek-one-front
npm install
```

2. Crear el archivo local de ambiente del frontend:

```powershell
Copy-Item .env.example .env
```

3. Compilar el backend para descargar dependencias Maven:

```powershell
cd ..\galtek-one-back
.\mvnw.cmd -DskipTests package
```

4. Crear o actualizar la base SQLite local:

```powershell
cd ..
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\database-setup.ps1
```

La base queda por defecto en:

```text
%APPDATA%\GaltekOne\galtek-one.db
```

El script aplica primero `galtek-one-schema.sql` y luego `galtek-one-seed.sql`. Los inserts del seed son idempotentes para evitar duplicados.

## Desarrollo web local

Levantar backend:

```powershell
cd galtek-one-back
java -Dspring.profiles.active=desktop -jar target\galtek-one-back-0.0.1.jar
```

En otra terminal, levantar frontend:

```powershell
cd galtek-one-front
npm start
```

El backend queda en:

```text
http://127.0.0.1:18080/GaltekOne
```

## Compilar la aplicacion de escritorio

Desde la raiz del repo:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\build-desktop.ps1
```

Esto compila el backend, copia el jar dentro de Tauri, compila React y genera la app de escritorio.

El ejecutable queda en:

```text
galtek-one-front\src-tauri\target\release\galtek-one.exe
```

El instalador NSIS queda en:

```text
galtek-one-front\src-tauri\target\release\bundle\nsis\
```

## Notas importantes

- No subir `.env`, bases SQLite, `node_modules`, `target`, builds ni ejecutables generados.
- Para entregar a un usuario final, compartir el instalador o el `.exe`, no el repo.
- La app de escritorio inicia el backend embebido automaticamente al abrirse.
- Si no se incluye un JRE en `galtek-one-front\src-tauri\resources\jre`, la app usa `javaw` del sistema.
