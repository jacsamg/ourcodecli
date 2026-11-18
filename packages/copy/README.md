# Our code CLI - Copy
- CLI para copiar archivos y directorios
- Instala con `npm i -D @ourcodecli/copy`

## Uso

```bash
# Copia un archivo o directorio
our-copy <source> <destination>

# Sobrescribe el destino si existe
our-copy <source> <destination> --force
our-copy <source> <destination> -f

# Conserva los enlaces simbólicos en lugar de resolverlos
our-copy <source> <destination> --preserve-symlinks
our-copy <source> <destination> -p

# Renombra la entrada copiada en el destino
our-copy <source> <destination> --rename <newName>
our-copy <source> <destination> -r <newName>

# Simula sin escribir cambios
our-copy <source> <destination> --dry-run
our-copy <source> <destination> -n

# Carga las operaciones desde un JSON de configuración
our-copy --config <pathToConfig>
our-copy -c <pathToConfig>

# Simula las operaciones de la configuración sin escribir cambios
our-copy --config <pathToConfig> --dry-run

# Muestra la ayuda y la versión
our-copy --help
our-copy --version
```

## Formato de configuración (`--config`)

El archivo de configuración debe cumplir con `OurCopyConfig`:

```ts
export interface CopyConfig {
  force?: boolean;
  preserveSymlinks?: boolean;
  rename?: string;
  sourcePath: string;
  targetPath: string[];
}

export interface OurCopyConfig {
  $schema?: string;
  copies: CopyConfig[];
}
```

Ejemplo:

```json
{
  "$schema": "./node_modules/@ourcodecli/copy/config.schema.json",
  "copies": [
    {
      "sourcePath": "./templates",
      "targetPath": ["./apps/web", "./apps/admin"],
      "rename": "templates",
      "force": true
    },
    {
      "sourcePath": "./assets/logo.svg",
      "targetPath": ["./apps/web/public/logo.svg"],
      "preserveSymlinks": true
    }
  ]
}
```

JSON Schema disponible en:
- `config.schema.json` (archivo JSON Schema portable)
- `src/config-schema.ts` (`COPY_CONFIG_SCHEMA`, usado por la validación de configuración en `src/config.ts`)

## Notas

- Se admiten rutas relativas y absolutas. Todas las rutas se normalizan desde el directorio de trabajo actual.
- Cada valor de `targetPath` tiene la misma semántica que `<destination>`: es la ruta final de la copia, salvo que se indique `rename`, en cuyo caso la copia se crea como `<targetPath>/<rename>`.
- `force` y `preserveSymlinks` son opcionales en la configuración y por defecto son `false`.
- Al usar `--config`, no pases argumentos posicionales ni `--force`, `--preserve-symlinks` o `--rename` (esos valores vienen de cada entrada de la configuración). `--config` solo puede indicarse una vez.
- `--dry-run` sí se permite junto con `--config` y se aplica a todas las entradas.
- La ejecución continúa a través de todos los destinos y al final reporta un resumen de éxitos y fallos.
