# Our code CLI - Delete
- CLI para eliminar archivos y directorios
- Instala con `npm i -D @ourcodecli/delete`

## Uso

```bash
# Elimina una o más rutas
our-delete <path1> [path2] ...

# Fuerza la eliminación sin confirmación
our-delete <path> --force

# Termina en el primer error (no procesa las rutas restantes)
our-delete <path> --strict

# Muestra la ayuda o la versión
our-delete --help
our-delete --version
```

Opciones:

- -f, --force     Fuerza la eliminación sin confirmación
- -s, --strict    Termina en el primer error (no procesa las rutas restantes)
- -h, --help      Muestra la ayuda
- -v, --version   Imprime la versión
