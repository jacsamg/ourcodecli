import type { MaterialSymbolAxis, MaterialSymbolFamily } from './types.js';

export const FAMILY_NAMES = {
  Outlined: 'Material Symbols Outlined',
  Rounded: 'Material Symbols Rounded',
  Sharp: 'Material Symbols Sharp',
} as const satisfies Readonly<Record<MaterialSymbolFamily, string>>;

/** La API CSS2 exige ejes en orden alfabético por tag. */
export const AXIS_ORDER = [
  'FILL',
  'GRAD',
  'ROND',
  'opsz',
  'wght',
] as const satisfies readonly MaterialSymbolAxis[];

export const AXIS_LIMITS = {
  opsz: { min: 20, max: 48 },
  wght: { min: 100, max: 700 },
  FILL: { min: 0, max: 1 },
  GRAD: { min: -50, max: 200 },
  ROND: { min: 0, max: 100 },
} as const satisfies Readonly<
  Record<MaterialSymbolAxis, { readonly min: number; readonly max: number }>
>;
