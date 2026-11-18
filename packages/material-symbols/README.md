# Our code CLI - Material Symbols

- CLI para generar subconjuntos **self-hosted** de [Google Material Symbols](https://fonts.google.com/icons): descarga solo los iconos, familias y ejes que configures, guarda los WOFF2 en tu proyecto y genera el CSS para usarlos sin depender del CDN de Google en runtime.
- Instala con `npm i -D @ourcodecli/material-symbols`
- Requiere Node.js 20 o posterior. Solo necesita Internet cuando regeneras las fuentes.

Pensado para aplicaciones Angular con Tailwind CSS, aunque el resultado sirve en cualquier aplicación web.

## Uso

```bash
# Usa ./material-symbols.config.json
our-material-symbols

# Usa otro archivo de configuración
our-material-symbols --config ./tools/material-symbols.config.json
our-material-symbols -c ./tools/material-symbols.config.json

# Ayuda y versión
our-material-symbols --help
our-material-symbols --version
```

Script sugerido en el `package.json` de tu aplicación:

```json
{
  "scripts": {
    "icons": "our-material-symbols"
  }
}
```

No lo ejecutes como parte del build normal: la generación depende de un servicio externo y el resultado puede cambiar cuando Google actualice las fuentes. Ejecútalo a mano cuando cambies iconos o ejes y versiona los archivos generados.

## Qué hace

1. Lee la lista cerrada de iconos del archivo de configuración.
2. Solicita a Google Fonts un subconjunto por cada familia seleccionada.
3. Descarga los WOFF2 resultantes y valida su firma.
4. Los guarda en `fontOutputDirectory` (por defecto `public/fonts`).
5. Reescribe los `@font-face` con URLs locales.
6. Genera clases CSS para las familias y los ejes variables.
7. Genera un archivo de metadatos y un snippet de preload.

## Configuración

Toda la configuración vive en un archivo JSON. Solo `icons` es obligatorio; el resto tiene valores por defecto.

**Las rutas relativas se resuelven desde el directorio del archivo de configuración**, no desde el directorio donde ejecutas el comando.

Ejemplo mínimo:

```json
{
  "$schema": "./node_modules/@ourcodecli/material-symbols/config.schema.json",
  "icons": ["add", "arrow_back", "close", "home", "search", "settings"]
}
```

Ejemplo completo con los valores por defecto:

```json
{
  "$schema": "./node_modules/@ourcodecli/material-symbols/config.schema.json",
  "icons": ["home", "search", "settings"],
  "families": ["Rounded"],
  "axes": {
    "opsz": { "enabled": true, "mode": "fixed", "value": 24 },
    "wght": { "enabled": true, "mode": "fixed", "value": 400 },
    "FILL": { "enabled": true, "mode": "range", "min": 0, "max": 1, "value": 0 },
    "GRAD": { "enabled": true, "mode": "fixed", "value": 0 },
    "ROND": { "enabled": false }
  },
  "display": "block",

  "fontOutputDirectory": "public/fonts",
  "publicFontBaseUrl": "/fonts",
  "cssOutputPath": "src/styles/material-symbols.css",
  "metadataOutputPath": "material-symbols.metadata.json",
  "preloadOutputPath": "material-symbols.preload.html",

  "cssClassPrefix": "material-symbols",
  "localFontFamilyPrefix": "Local Material Symbols",
  "useContentHash": true,
  "fileBaseName": "material-symbols",

  "allowMultipleFontFilesPerFamily": true,
  "removeObsoleteGeneratedFonts": true,

  "requestTimeoutMs": 30000,
  "maximumCssBytes": 262144,
  "maximumFontBytesEach": 5242880,
  "maximumTotalFontBytes": 15728640,
  "performanceBudgetBytes": 256000,

  "css": {
    "includeBaseClasses": true,
    "includeAxisUtilities": true,
    "includeSourceComment": true,
    "defaultAxisValues": { "opsz": 24, "wght": 400, "FILL": 0, "GRAD": 0, "ROND": 0 },
    "utilities": {
      "outlined": { "FILL": 0 },
      "filled": { "FILL": 1 },
      "thin": { "wght": 200 },
      "regular": { "wght": 400 },
      "bold": { "wght": 700 },
      "gradeLow": { "GRAD": -25 },
      "gradeHigh": { "GRAD": 200 },
      "square": { "ROND": 0 },
      "round": { "ROND": 100 },
      "optical20": { "opsz": 20 },
      "optical24": { "opsz": 24 },
      "optical40": { "opsz": 40 },
      "optical48": { "opsz": 48 }
    }
  },

  "dryRun": false
}
```

El JSON Schema está en `config.schema.json` (publicado con el paquete); referéncialo con `$schema` para tener autocompletado y validación en el editor. El CLI rechaza propiedades desconocidas.

| Propiedad | Descripción |
| --- | --- |
| `icons` | Ligaduras incluidas en todas las familias. Se recortan espacios, se valida el formato (`a-z`, `0-9`, `_`), se rechazan duplicados y se ordenan. |
| `families` | `Outlined`, `Rounded` y/o `Sharp`. Cada familia genera una fuente independiente. |
| `axes` | Configuración de ejes variables (ver abajo). Los ejes que no indiques usan el valor por defecto. |
| `display` | `font-display`: `auto`, `block`, `swap`, `fallback` u `optional`. |
| `fontOutputDirectory` | Directorio donde se guardan los WOFF2. |
| `publicFontBaseUrl` | URL pública de ese directorio (debe empezar con `/`). |
| `cssOutputPath`, `metadataOutputPath`, `preloadOutputPath` | Rutas de los archivos generados. |
| `cssClassPrefix` | Prefijo de clases y variables CSS. |
| `localFontFamilyPrefix` | Prefijo del `font-family` local (p. ej. `Local Material Symbols Rounded`). |
| `useContentHash` | Añade un hash de contenido al nombre del archivo. |
| `fileBaseName` | Prefijo de los archivos de fuente generados. |
| `removeObsoleteGeneratedFonts` | Elimina fuentes anteriores con el mismo prefijo tras una generación correcta. |
| `performanceBudgetBytes` | Peso máximo total de las fuentes; `null` lo desactiva. |
| `dryRun` | Valida la configuración e imprime las URLs sin descargar ni escribir nada. |

## Ejes variables

| Eje    | Función                                         | Rango      |
| ------ | ----------------------------------------------- | ---------: |
| `FILL` | Alterna entre contorno y relleno                |     `0..1` |
| `wght` | Peso visual del icono                           | `100..700` |
| `GRAD` | Ajuste de grosor sin alterar tanto la ocupación | `-50..200` |
| `opsz` | Diseño óptico para distintos tamaños            |   `20..48` |
| `ROND` | Redondez cuando la familia lo soporta           |   `0..100` |

Cada eje puede estar:

- **Desactivado** — `{ "enabled": false }`: no se envía y Google usa el valor por defecto.
- **Fijo** — `{ "enabled": true, "mode": "fixed", "value": 400 }`: fuente más ligera, pero no podrás cambiar ese eje desde CSS.
- **Rango** — `{ "enabled": true, "mode": "range", "min": 100, "max": 700, "value": 400 }`: permite cualquier valor del rango mediante clases, variables CSS o `font-variation-settings`, a costa de un WOFF2 mayor.

Mantén fijos los ejes que no necesites variar en runtime. La configuración por defecto solo deja `FILL` como rango para poder alternar entre outlined y filled.

Los valores de `css.defaultAxisValues` deben existir en la fuente generada; si no, el CLI falla con un error de configuración.

## Archivos generados

Con la configuración por defecto (rutas relativas al archivo de config):

```text
material-symbols.config.json
material-symbols.metadata.json
material-symbols.preload.html
public/
└── fonts/
    └── material-symbols-rounded.<hash>.woff2
src/
└── styles/
    └── material-symbols.css
```

- **WOFF2**: solo los iconos y variaciones solicitados para una familia.
- **CSS**: los `@font-face` reescritos con URLs locales, una clase base por familia, variables CSS para los ejes y utilidades opcionales. Las clases auxiliares que devuelve Google se descartan.
- **Metadata JSON**: familias, iconos, ejes, URLs usadas, nombres, hashes y tamaños de los archivos, rutas de salida y versión de Node. Útil para revisar cambios en Git.
- **Preload HTML**: etiquetas `<link rel="preload">` listas para copiar al `<head>`. Precarga solo la familia usada en el primer render.

## Hash de contenido y caché

Con `useContentHash: true` (por defecto) los archivos se llaman `material-symbols-rounded.dc379579c09c.woff2`: la URL cambia cuando cambia el contenido, así que puedes servirlos con

```http
Cache-Control: public, max-age=31536000, immutable
```

Con `useContentHash: false` la URL es estable (`material-symbols-rounded.woff2`), lo que simplifica el preload manual, pero no uses `immutable` salvo que tengas otro mecanismo de invalidación.

## Integración con Angular

Importa el CSS generado una sola vez, en el stylesheet global:

```css
@import './styles/material-symbols.css';
```

o en `angular.json`:

```json
"styles": ["src/styles/material-symbols.css"]
```

Y usa la clase de la familia:

```html
<span class="material-symbols-rounded">settings</span>
```

## Uso con Tailwind CSS

La clase base no fija `font-size`: el icono hereda el tamaño del contenedor y las utilidades de Tailwind pueden cambiar tamaño y color directamente en el icono, sin depender del orden de los estilos:

```html
<span class="material-symbols-rounded text-2xl text-blue-600">home</span>
<span class="material-symbols-rounded text-[40px] text-red-500">delete</span>

<!-- Sin utilidad de tamaño, hereda el del contenedor -->
<button class="text-sm">
  <span class="material-symbols-rounded" aria-hidden="true">close</span>
</button>
```

Es una fuente, no un SVG: usa `text-*` para el color, no `fill-current`.

## Utilidades de ejes

Se generan a partir de `css.utilities` como `.material-symbols--<nombre>` y modifican variables CSS, por lo que se pueden combinar:

```html
<span class="material-symbols-rounded material-symbols--filled material-symbols--bold text-2xl">
  favorite
</span>
```

Una utilidad solo se genera si su valor existe en la fuente. Por ejemplo, `bold` (`wght: 700`) no se genera si `wght` está fijo en `400`; configúralo como rango `100..700` para usarla.

También puedes fijar valores arbitrarios dentro de los rangos generados:

```html
<span class="material-symbols-rounded [--material-symbols-fill:1] [--material-symbols-wght:550]">
  favorite
</span>
```

`text-2xl` cambia el tamaño real del icono; `opsz` (p. ej. `material-symbols--optical24`) cambia el diseño interno del glifo para una escala óptica, pero no sustituye a `font-size`.

## Accesibilidad

Icono decorativo junto a texto visible:

```html
<button type="button">
  <span class="material-symbols-rounded" aria-hidden="true">settings</span>
  Configuración
</button>
```

Icono como único contenido: describe la acción en el elemento interactivo y no dependas del nombre de la ligadura.

```html
<button type="button" aria-label="Cerrar">
  <span class="material-symbols-rounded" aria-hidden="true">close</span>
</button>
```

## Rendimiento y robustez

- `performanceBudgetBytes` hace fallar la generación si el total de fuentes lo supera, para detectar demasiadas familias, iconos o rangos variables.
- Incluye solo los iconos usados, evita habilitar las tres familias sin necesidad y conserva como rango solo los ejes que cambien en runtime.
- El CLI aplica timeouts, reintentos con espera incremental (en errores 429/5xx y de red), límites de tamaño para CSS y fuentes, validación de la firma WOFF/WOFF2 y escritura atómica. La limpieza de fuentes obsoletas ocurre solo después de escribir correctamente las nuevas.
- Google Fonts decide el formato según el `User-Agent`; el CLI usa uno de navegador moderno (configurable con `userAgent`) para recibir WOFF2.

## Flujo de actualización recomendado

1. Modifica `icons`, `families` o `axes` en el archivo de configuración.
2. Ejecuta `our-material-symbols` (opcionalmente primero con `"dryRun": true`).
3. Revisa `git diff` y el tamaño registrado en los metadatos.
4. Revisa visualmente los iconos en la aplicación.
5. Versiona la configuración, las fuentes, el CSS y los metadatos, para que el build y la CI no necesiten acceder a Google.

## Troubleshooting

**Se muestra el texto `settings` en lugar del icono.** Comprueba que el icono esté en `icons`, que hayas regenerado, que el CSS esté importado globalmente, que la fuente responda HTTP 200, que la clase corresponda a una familia generada y que nada sobrescriba `font-feature-settings: 'liga'`.

**`text-2xl` no cambia el tamaño.** El CSS generado no fija `font-size`; comprueba que no estés usando un CSS antiguo (por ejemplo, el CSS por defecto de Google, que fija `24px`) ni otra regla que fije `font-size` en el icono.

**`material-symbols--bold` no produce cambios / no existe.** El eje `wght` está fijo; configúralo como rango que incluya `700`.

**La fuente no se actualiza en el navegador.** Con `useContentHash: false` puede ser caché del navegador o del hosting: purga el caché o activa el hash.

**Se supera el presupuesto.** Reduce familias, iconos, ejes variables o amplitud de rangos; o aumenta `performanceBudgetBytes` conscientemente.

## Licencias

Material Symbols es un recurso de Google. Antes de redistribuir las fuentes, conserva la información de licencia correspondiente y verifica que tu forma de redistribución cumpla sus términos.
