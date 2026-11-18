import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { buildAxisRequest } from './axes.js';
import { FAMILY_NAMES } from './constants.js';
import { CliError, ErrorCode } from './errors.js';
import { generatedFileName } from './files.js';
import type {
  DownloadedFont,
  FamilyResult,
  FontFormat,
  MaterialSymbolFamily,
  ResolvedConfig,
} from './types.js';

export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

export function buildCssApiUrl(
  config: Pick<ResolvedConfig, 'axes' | 'display'>,
  family: MaterialSymbolFamily,
  sortedIcons: readonly string[],
): string {
  const { tags, values } = buildAxisRequest(config.axes);
  let familyValue: string = FAMILY_NAMES[family];
  if (tags.length > 0) familyValue += `:${tags.join(',')}@${values.join(',')}`;

  const params = new URLSearchParams();
  params.set('family', familyValue);
  params.set('icon_names', sortedIcons.join(','));
  params.set('display', config.display);
  return `https://fonts.googleapis.com/css2?${params.toString()}`;
}

async function fetchWithRetry(
  url: string,
  options: {
    readonly timeoutMs: number;
    readonly headers?: Readonly<Record<string, string>>;
    readonly attempts?: number;
    readonly label?: string;
  },
): Promise<Response> {
  const { timeoutMs, headers = {}, attempts = 3, label = 'recurso' } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let retryable = true;
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) return response;

      const body = await response.text().catch(() => '');
      lastError = new CliError(
        ErrorCode.NETWORK_ERROR,
        `No se pudo descargar ${label}: HTTP ${response.status} ${response.statusText}\n` +
          `URL: ${url}\n${body.slice(0, 800)}`,
      );
      retryable = response.status === 429 || response.status >= 500;
    } catch (error) {
      lastError = new CliError(
        ErrorCode.NETWORK_ERROR,
        `No se pudo descargar ${label}: ${error instanceof Error ? error.message : String(error)}\nURL: ${url}`,
      );
    }

    if (!retryable || attempt === attempts) break;
    await new Promise<void>((done) => {
      setTimeout(done, 400 * 2 ** (attempt - 1));
    });
  }

  throw lastError;
}

async function readBufferWithLimit(
  response: Response,
  maximumBytes: number,
  label: string,
): Promise<Buffer> {
  const tooLarge = (bytes: number) =>
    new CliError(
      ErrorCode.LIMIT_EXCEEDED,
      `${label} excede el límite: ${bytes} > ${maximumBytes} bytes.`,
    );

  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw tooLarge(contentLength);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maximumBytes) throw tooLarge(buffer.byteLength);
  return buffer;
}

export function extractRemoteFontUrls(cssText: string): string[] {
  const urls: string[] = [];
  const pattern = /url\(\s*(['"]?)(https:\/\/[^'")\s]+)\1\s*\)/g;
  for (const match of cssText.matchAll(pattern)) {
    const url = match[2];
    if (url !== undefined && !urls.includes(url)) urls.push(url);
  }
  if (urls.length === 0) {
    throw new CliError(
      ErrorCode.INVALID_RESPONSE,
      `No se encontraron fuentes en el CSS:\n${cssText.slice(0, 1200)}`,
    );
  }
  return urls;
}

export function detectFontFormat(
  buffer: Buffer,
  sourceUrl: string,
): FontFormat {
  const signature = buffer.subarray(0, 4).toString('ascii');
  if (signature === 'wOF2') return { extension: '.woff2', cssFormat: 'woff2' };
  if (signature === 'wOFF') return { extension: '.woff', cssFormat: 'woff' };
  throw new CliError(
    ErrorCode.INVALID_FONT,
    `El recurso no parece WOFF/WOFF2. Firma ${JSON.stringify(signature)}. URL: ${sourceUrl}`,
  );
}

export async function downloadFamily(
  config: ResolvedConfig,
  family: MaterialSymbolFamily,
): Promise<FamilyResult> {
  const cssApiUrl = buildCssApiUrl(config, family, config.icons);
  console.log(`Solicitando ${family}: ${cssApiUrl}`);

  const cssResponse = await fetchWithRetry(cssApiUrl, {
    timeoutMs: config.requestTimeoutMs,
    label: `CSS de ${family}`,
    headers: { accept: 'text/css,*/*;q=0.1', 'user-agent': config.userAgent },
  });
  const cssBuffer = await readBufferWithLimit(
    cssResponse,
    config.maximumCssBytes,
    `CSS de ${family}`,
  );
  const remoteCss = cssBuffer.toString('utf8');
  if (!remoteCss.includes('@font-face')) {
    throw new CliError(
      ErrorCode.INVALID_RESPONSE,
      `La respuesta de ${family} no contiene @font-face.`,
    );
  }

  const sourceUrls = extractRemoteFontUrls(remoteCss);
  if (!config.allowMultipleFontFilesPerFamily && sourceUrls.length !== 1) {
    throw new CliError(
      ErrorCode.INVALID_RESPONSE,
      `${family} devolvió ${sourceUrls.length} archivos y "allowMultipleFontFilesPerFamily" es false.`,
    );
  }

  const fonts: DownloadedFont[] = [];
  for (const [index, sourceUrl] of sourceUrls.entries()) {
    const response = await fetchWithRetry(sourceUrl, {
      timeoutMs: config.requestTimeoutMs,
      label: `fuente ${family} ${index + 1}/${sourceUrls.length}`,
      headers: {
        accept: 'font/woff2,font/woff,*/*;q=0.1',
        'user-agent': config.userAgent,
        referer: 'https://fonts.googleapis.com/',
      },
    });
    const buffer = await readBufferWithLimit(
      response,
      config.maximumFontBytesEach,
      `Fuente ${family}`,
    );
    const format = detectFontFormat(buffer, sourceUrl);
    const hash = sha256(buffer);
    const fileName = generatedFileName(
      config,
      family,
      index,
      sourceUrls.length,
      hash,
      format.extension,
    );

    fonts.push({
      family,
      sourceUrl,
      finalPath: resolve(config.fontOutputDirectory, fileName),
      fileName,
      extension: format.extension,
      cssFormat: format.cssFormat,
      bytes: buffer.byteLength,
      sha256: hash,
      contentType: response.headers.get('content-type'),
      buffer,
    });
  }

  return {
    family,
    cssApiUrl,
    remoteCss,
    cssResponseMetadata: {
      contentType: cssResponse.headers.get('content-type'),
      etag: cssResponse.headers.get('etag'),
      lastModified: cssResponse.headers.get('last-modified'),
      sha256: sha256(cssBuffer),
      bytes: cssBuffer.byteLength,
    },
    fonts,
  };
}
