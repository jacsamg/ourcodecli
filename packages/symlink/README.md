# Our code CLI - Symlink
- CLI para crear enlaces simbólicos a archivos o directorios
- Instala con `npm i -D @ourcodecli/symlink`

## Uso

```bash
# Crea enlaces simbólicos en uno o más directorios de destino
our-symlink <sourcePath> <targetPath>,<targetPath>,...

# Renombra el enlace simbólico en los destinos
our-symlink <sourcePath> <targetPath>,<targetPath> --name <name>
our-symlink <sourcePath> <targetPath>,<targetPath> -n <name>

# Reemplaza la entrada de destino si existe
our-symlink <sourcePath> <targetPath>,<targetPath> --force
our-symlink <sourcePath> <targetPath>,<targetPath> -f

# Carga las operaciones desde un JSON de configuración
our-symlink --config <pathToConfig>
our-symlink -c <pathToConfig>

# Muestra la ayuda y la versión
our-symlink --help
our-symlink --version
```

## Formato de configuración (`--config`)

El archivo de configuración debe cumplir con `OurSymlinkConfig`:

```ts
export interface SymlinkConfig {
  force?: boolean;
  sourcePath: string;
  targetName?: string;
  targetDir: string[];
}

export interface OurSymlinkConfig {
  $schema?: string;
  symlinks: SymlinkConfig[];
}
```

Ejemplo:

```json
{
  "symlinks": [
    {
      "force": true,
      "sourcePath": "./packages/shared/src",
      "targetName": "shared-lib",
      "targetDir": ["./apps/web", "./apps/admin"]
    },
    {
      "sourcePath": "./packages/theme/tokens.json",
      "targetDir": ["./apps/web", "./apps/mobile"]
    },
    {
      "force": false,
      "sourcePath": "./packages/utils/src",
      "targetName": "utils",
      "targetDir": ["./apps/web", "./apps/mobile"]
    }
  ]
}
```

JSON Schema disponible en:
- `config.schema.json` (archivo JSON Schema portable)
- `src/config-schema.ts` (`SYMLINK_CONFIG_SCHEMA`, usado por la validación de configuración en `src/symlink.ts`)

## Notas

- Se admiten rutas relativas y absolutas. Todas las rutas se normalizan desde el directorio de trabajo actual.
- `sourcePath` puede ser un archivo o un directorio.
- Los valores de `targetPath` se tratan como directorios de destino. Los directorios que no existen se crean.
- `force` es opcional en la configuración y por defecto es `false`.
- `targetName` es opcional en la configuración y por defecto es el nombre base del origen.
- La ejecución continúa a través de todos los destinos y al final reporta un resumen de éxitos y fallos.
- Al usar `--config`, no pases `--name` ni `--force` en la línea de comandos (esos valores vienen de cada entrada de la configuración).
- En Windows, los enlaces a directorios usan `junction` por compatibilidad.
