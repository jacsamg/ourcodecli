# @ourcodecli/icon-generator

- CLI para generar iconos PNG de PWA en los tamaños habituales a partir de una sola imagen
- Instala con `npm i -D @ourcodecli/icon-generator`

## Uso

```
our-icon-gen <source> <destination> <name> [options]
```

- source: ruta de la imagen de origen (p. ej. un PNG cuadrado grande o un SVG)
- destination: directorio de salida donde se escriben los iconos
- name: nombre base de los archivos generados (p. ej. `app` -> `app-192x192.png`)

### Opciones

- `-s, --sizes <list>` Lista de tamaños separados por comas (por defecto: 72,96,128,144,152,192,384,512)
- `-n, --dry-run` Muestra qué se generaría sin escribir archivos
- `-h, --help` Muestra la ayuda
- `-v, --version` Muestra la versión

### Ejemplos

```
our-icon-gen ./logo.png ./public/icons app
our-icon-gen ./logo.png ./icons app --sizes 72,96,128 -n
```

## Notas

- Usa `sharp` para procesar las imágenes.
- La imagen de origen debe ser lo bastante grande para reducirse con nitidez a los tamaños de destino.
