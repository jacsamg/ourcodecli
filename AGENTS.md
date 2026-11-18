# Guía para agentes del proyecto

Instrucciones globales del monorepo `ourcodecli`. Aplican a todo el repositorio
y se complementan con el `AGENTS.md` de cada paquete (si existe).

## Mapa del monorepo

## Flujo de trabajo obligatorio

1. Determina qué paquetes y archivos serán afectados. Revisa su `AGENTS.md`,
   README, `package.json` y la configuración de TypeScript.
2. Revisa `git status --short`. Conserva cambios existentes del usuario y no
   reformatees archivos ajenos al alcance.
3. Haz cambios pequeños y coherentes con la arquitectura existente. Reutiliza
   tipos, validadores, servicios y patrones antes de crear otros.
4. Ejecuta las validaciones del paquete afectado y de todos los consumidores
   si el cambio cruza paquetes.
5. Documenta en comentarios solo las particularidades que no son evidentes al
   leer el código.
6. En la entrega, resume archivos modificados, validaciones ejecutadas y
   limitaciones o pasos manuales pendientes.

## Convenciones generales

- Código en inglés; comentarios y documentación en español, salvo nombres
  propios, APIs, identificadores y términos técnicos. El texto visible para el usuario va en español.
- TypeScript estricto. Evita `any`; usa tipos concretos o `unknown` con
  validación explícita cuando los datos sean inciertos.
- No agregues dependencias, scripts npm, archivos de configuración ni
  abstracciones sin una necesidad concreta.
- Respeta la configuración existente de Biome.

### Biome

Hay una sola configuración base: `biome.json` del root (80 columnas, comillas
simples, 2 espacios, solo archivos bajo `src/`). `@biomejs/biome` se instala
con versión exacta solo en el root; no lo agregues como dependencia de los
paquetes. Cada paquete tiene un `biome.json` mínimo con `"root": false` y
`"extends": "//"`; las reglas específicas de un paquete van ahí. Los `$schema`
apuntan a `node_modules/@biomejs/biome/configuration_schema.json` para seguir
siempre a la versión instalada.

Revisa solo los archivos que cambias con `npx biome check <ruta>` (o
`--write`). Desde el root, `npm run lint` y `npm run format` cubren todos los
paquetes; dentro de un paquete, `npm run lint` revisa solo ese paquete.

### Fallar primero y rápido (fail-fast)

Aplica en todos los paquetes:

- Valida precondiciones, entradas, permisos, recursos y estados imposibles al
  inicio de la función o flujo, con cláusulas de guarda (`return`/`throw`).
- Ordena las validaciones para que fallen primero las más baratas, evidentes o
  frecuentes. No continúes cuando ya se sabe que la operación no puede
  completarse.
- Deja el camino exitoso lineal, sin `if` anidados.
- Los errores deben ser explícitos e indicar qué precondición falló.

```ts
function processUser(user: User | null): Result {
  if (!user) {
    throw new Error('El usuario es requerido');
  }

  if (!user.enabled) {
    throw new Error('El usuario debe estar habilitado');
  }

  return process(user);
}
```