param(
  [string]$DatabasePath = "$env:APPDATA\GaltekOne\galtek-one.db",
  [string]$SchemaPath = "$PSScriptRoot\galtek-one-schema.sql",
  [string]$SeedPath = "$PSScriptRoot\galtek-one-seed.sql",
  [switch]$Seed
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SchemaPath)) {
  throw "No se encontro el schema: $SchemaPath"
}

$dbDirectory = Split-Path -Parent $DatabasePath
if ($dbDirectory) {
  New-Item -ItemType Directory -Force -Path $dbDirectory | Out-Null
}

$databaseExists = Test-Path -LiteralPath $DatabasePath
if ($databaseExists) {
  $databaseExists = (Get-Item -LiteralPath $DatabasePath).Length -gt 0
}

$shouldSeed = $Seed.IsPresent -or -not $databaseExists
if ($shouldSeed -and -not (Test-Path -LiteralPath $SeedPath)) {
  throw "No se encontro el seed: $SeedPath"
}

$sqliteJar = Get-ChildItem -Path "$env:USERPROFILE\.m2\repository\org\xerial\sqlite-jdbc" -Recurse -Filter "sqlite-jdbc-*.jar" -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch "sources|javadoc" } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $sqliteJar) {
  Push-Location "$PSScriptRoot\galtek-one-back"
  try {
    .\mvnw.cmd -q -DskipTests dependency:copy-dependencies "-DincludeGroupIds=org.xerial" "-DincludeArtifactIds=sqlite-jdbc" "-DoutputDirectory=target/db-tools"
  } finally {
    Pop-Location
  }

  $sqliteJar = Get-ChildItem -Path "$PSScriptRoot\galtek-one-back\target\db-tools" -Filter "sqlite-jdbc-*.jar" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

if (-not $sqliteJar) {
  throw "No se encontro sqlite-jdbc. Ejecuta primero: cd galtek-one-back; .\mvnw.cmd -DskipTests package"
}

$tempDir = Join-Path $env:TEMP "galtek-one-db-setup"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
$javaFile = Join-Path $tempDir "GaltekOneSqlRunner.java"

@'
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class GaltekOneSqlRunner {
  public static void main(String[] args) throws Exception {
    if (args.length < 2) {
      throw new IllegalArgumentException("Uso: GaltekOneSqlRunner <db> <sql...>");
    }

    Class.forName("org.sqlite.JDBC");
    try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + args[0] + "?busy_timeout=5000&foreign_keys=on")) {
      try (Statement statement = connection.createStatement()) {
        statement.execute("PRAGMA foreign_keys = ON");
        statement.execute("PRAGMA busy_timeout = 5000");
        for (int i = 1; i < args.length; i++) {
          runSqlFile(statement, Path.of(args[i]));
        }
      }
    }
  }

  private static void runSqlFile(Statement statement, Path file) throws Exception {
    String sql = Files.readString(file, StandardCharsets.UTF_8).replace("\uFEFF", "");
    for (String command : splitSql(sql)) {
      String trimmed = command.trim();
      if (!trimmed.isEmpty()) {
        try {
          statement.execute(trimmed);
        } catch (Exception ex) {
          if (!isIgnorableMigrationError(trimmed, ex)) {
            throw ex;
          }
        }
      }
    }
  }

  private static boolean isIgnorableMigrationError(String sql, Exception ex) {
    String normalizedSql = sql == null ? "" : sql.trim().toUpperCase();
    String message = ex.getMessage() == null ? "" : ex.getMessage().toLowerCase();
    return normalizedSql.startsWith("ALTER TABLE")
        && normalizedSql.contains(" ADD COLUMN ")
        && message.contains("duplicate column name");
  }

  private static List<String> splitSql(String sql) {
    List<String> statements = new ArrayList<>();
    StringBuilder current = new StringBuilder();
    boolean singleQuote = false;
    boolean doubleQuote = false;
    boolean lineComment = false;
    boolean blockComment = false;

    for (int i = 0; i < sql.length(); i++) {
      char ch = sql.charAt(i);
      char next = i + 1 < sql.length() ? sql.charAt(i + 1) : '\0';

      if (lineComment) {
        if (ch == '\n') lineComment = false;
        continue;
      }

      if (blockComment) {
        if (ch == '*' && next == '/') {
          blockComment = false;
          i++;
        }
        continue;
      }

      if (!singleQuote && !doubleQuote && ch == '-' && next == '-') {
        lineComment = true;
        i++;
        continue;
      }

      if (!singleQuote && !doubleQuote && ch == '/' && next == '*') {
        blockComment = true;
        i++;
        continue;
      }

      if (ch == '\'' && !doubleQuote) {
        current.append(ch);
        if (singleQuote && next == '\'') {
          current.append(next);
          i++;
          continue;
        }
        singleQuote = !singleQuote;
        continue;
      }

      if (ch == '"' && !singleQuote) {
        doubleQuote = !doubleQuote;
        current.append(ch);
        continue;
      }

      if (ch == ';' && !singleQuote && !doubleQuote) {
        statements.add(current.toString());
        current.setLength(0);
        continue;
      }

      current.append(ch);
    }

    statements.add(current.toString());
    return statements;
  }
}
'@ | Set-Content -Path $javaFile -Encoding ASCII

$classpathItems = @($sqliteJar.FullName, $tempDir)
$slf4jJars = Get-ChildItem -Path "$env:USERPROFILE\.m2\repository\org\slf4j" -Recurse -Filter "slf4j-*.jar" -ErrorAction SilentlyContinue
if ($slf4jJars) {
  $classpathItems += $slf4jJars.FullName
}

$classpath = $classpathItems -join [IO.Path]::PathSeparator

javac -cp $classpath $javaFile
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo compilar el runner SQL."
}

$sqlFiles = @($SchemaPath)
if ($shouldSeed) {
  $sqlFiles += $SeedPath
}

java -cp $classpath GaltekOneSqlRunner $DatabasePath $sqlFiles
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo aplicar schema/seed."
}

Write-Host "Base lista: $DatabasePath"
if ($shouldSeed) {
  Write-Host "Aplicados: $SchemaPath, $SeedPath"
} else {
  Write-Host "Aplicado: $SchemaPath"
  Write-Host "Seed omitido: la base ya existe. Usa -Seed solo si quieres refrescar datos demo."
}
