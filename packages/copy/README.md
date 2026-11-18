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

# Muestra la ayuda y la versión
our-copy --help
our-copy --version
```
