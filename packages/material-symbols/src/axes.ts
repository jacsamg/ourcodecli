import { AXIS_ORDER } from './constants.js';
import type {
  AxesConfig,
  AxisConfig,
  AxisValueMap,
  MaterialSymbolAxis,
} from './types.js';

export function formatNumber(value: number): string {
  return String(Number(value));
}

export function axisContainsValue(axis: AxisConfig, value: number): boolean {
  if (!axis.enabled) return false;
  return axis.mode === 'fixed'
    ? value === axis.value
    : value >= axis.min && value <= axis.max;
}

/** Tags y valores para la URL de la API CSS2, en el orden exigido. */
export function buildAxisRequest(axes: AxesConfig): {
  tags: MaterialSymbolAxis[];
  values: string[];
} {
  const tags: MaterialSymbolAxis[] = [];
  const values: string[] = [];

  for (const tag of AXIS_ORDER) {
    const axis = axes[tag];
    if (!axis.enabled) continue;
    tags.push(tag);
    values.push(
      axis.mode === 'range'
        ? `${formatNumber(axis.min)}..${formatNumber(axis.max)}`
        : formatNumber(axis.value),
    );
  }

  return { tags, values };
}

/**
 * Valor CSS inicial de cada eje habilitado. Devuelve también los ejes cuyo
 * valor configurado no existe en la fuente generada.
 */
export function defaultAxisEntries(
  axes: AxesConfig,
  defaults: AxisValueMap,
): { entries: [MaterialSymbolAxis, number][]; outOfRange: string[] } {
  const entries: [MaterialSymbolAxis, number][] = [];
  const outOfRange: string[] = [];

  for (const tag of AXIS_ORDER) {
    const axis = axes[tag];
    if (!axis.enabled) continue;

    const fallback =
      axis.mode === 'fixed' ? axis.value : (axis.value ?? axis.min);
    const value = defaults[tag] ?? fallback;
    if (!axisContainsValue(axis, value)) outOfRange.push(`${tag}=${value}`);
    entries.push([tag, value]);
  }

  return { entries, outOfRange };
}
