import { buildGeneratedCss, buildPreloadHtml } from './css.js';
import { CliError, ErrorCode } from './errors.js';
import { removeObsoleteFonts, writeAtomically } from './files.js';
import { buildCssApiUrl, downloadFamily } from './google-fonts.js';
import type { FamilyResult, ResolvedConfig } from './types.js';

const METADATA_SCHEMA_VERSION = 2;

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString('en-US')} bytes`;
}

export async function generate(config: ResolvedConfig): Promise<void> {
  console.log(`Familias: ${config.families.join(', ')}`);
  console.log(`Iconos por familia: ${config.icons.length}`);
  console.log(`Total de subconjuntos: ${config.families.length}\n`);

  if (config.dryRun) {
    console.log('Modo dryRun: no se descargará ni escribirá ningún archivo.\n');
    for (const family of config.families) {
      console.log(`${family}: ${buildCssApiUrl(config, family, config.icons)}`);
    }
    return;
  }

  const results: FamilyResult[] = [];
  for (const family of config.families) {
    results.push(await downloadFamily(config, family));
  }

  const fonts = results.flatMap((result) => [...result.fonts]);
  const totalFontBytes = fonts.reduce((sum, font) => sum + font.bytes, 0);
  if (totalFontBytes > config.maximumTotalFontBytes) {
    throw new CliError(
      ErrorCode.LIMIT_EXCEEDED,
      `Las fuentes exceden maximumTotalFontBytes: ${totalFontBytes} > ${config.maximumTotalFontBytes} bytes.`,
    );
  }
  if (
    config.performanceBudgetBytes !== null &&
    totalFontBytes > config.performanceBudgetBytes
  ) {
    throw new CliError(
      ErrorCode.BUDGET_EXCEEDED,
      `Las fuentes exceden el presupuesto: ${totalFontBytes} > ${config.performanceBudgetBytes} bytes.`,
    );
  }

  for (const font of fonts) await writeAtomically(font.finalPath, font.buffer);
  await writeAtomically(
    config.cssOutputPath,
    buildGeneratedCss(config, results),
  );
  await writeAtomically(
    config.preloadOutputPath,
    buildPreloadHtml(config, fonts),
  );

  const metadata = {
    schemaVersion: METADATA_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    families: config.families,
    icons: config.icons,
    axes: config.axes,
    display: config.display,
    totalFontBytes,
    fonts: fonts.map(({ buffer: _buffer, ...font }) => font),
    requests: results.map((result) => ({
      family: result.family,
      cssApiUrl: result.cssApiUrl,
      cssResponse: result.cssResponseMetadata,
    })),
    outputs: {
      fontDirectory: config.fontOutputDirectory,
      css: config.cssOutputPath,
      preload: config.preloadOutputPath,
    },
  };
  await writeAtomically(
    config.metadataOutputPath,
    `${JSON.stringify(metadata, null, 2)}\n`,
  );

  const obsolete = await removeObsoleteFonts(
    config,
    fonts.map((font) => font.fileName),
  );

  console.log('\nGeneración completada');
  for (const font of fonts) {
    console.log(
      `- ${font.family}: ${font.fileName} (${formatBytes(font.bytes)})`,
    );
  }
  console.log(`CSS: ${config.cssOutputPath}`);
  console.log(`Preload: ${config.preloadOutputPath}`);
  console.log(`Metadata: ${config.metadataOutputPath}`);
  console.log(`Total: ${formatBytes(totalFontBytes)}`);
  if (obsolete.length > 0)
    console.log(`Archivos obsoletos eliminados: ${obsolete.length}`);
}
