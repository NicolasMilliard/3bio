import {
  buildProfileDocumentMetadata,
  NOINDEX_ROBOTS,
  renderPageNotFoundDocumentHead,
  renderProfileDocumentHead,
  type ProfileMetadataProfile,
  type ProfileMetadataStatus,
} from '../documentMetadata';
import { getPublicOrigin } from './routing';

const METADATA_START = '<!-- 3bio-metadata:start -->';
const METADATA_END = '<!-- 3bio-metadata:end -->';

const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; connect-src 'self' https: wss:; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data: blob: https:; manifest-src 'self'; object-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:",
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

type AssetResponseContext = {
  request: Request;
  next: () => Promise<Response>;
};

export const replaceMetadataBlock = (html: string, head: string) => {
  const startIndex = html.indexOf(METADATA_START);
  const endIndex = html.indexOf(METADATA_END);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return html;
  }

  const before = html.slice(0, startIndex);
  const after = html.slice(endIndex + METADATA_END.length);

  return `${before}${METADATA_START}\n    ${head}\n    ${METADATA_END}${after}`;
};

const applySecurityHeaders = (headers: Headers) => {
  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }
};

export const buildCanonicalRedirectResponse = (
  requestUrl: URL,
  canonicalUrl: URL,
) =>
  new Response(null, {
    status: 308,
    headers: {
      ...securityHeaders,
      Location: canonicalUrl.toString(),
      ...(requestUrl.hostname.endsWith('.pages.dev')
        ? { 'X-Robots-Tag': NOINDEX_ROBOTS }
        : {}),
    },
  });

export const buildProfileHtmlResponse = async ({
  response,
  request,
  lensHandle,
  profile,
  status,
  responseStatus,
}: {
  response: Response;
  request: Request;
  lensHandle: string;
  profile?: ProfileMetadataProfile;
  status: ProfileMetadataStatus;
  responseStatus?: number;
}) => {
  const headers = new Headers(response.headers);
  const requestUrl = new URL(request.url);
  const origin = getPublicOrigin(requestUrl);
  const metadata = buildProfileDocumentMetadata({
    origin,
    lensHandle,
    profile,
    status,
    defaultSocialImageUrl: `${origin}/og.png`,
  });

  applySecurityHeaders(headers);

  headers.delete('Content-Length');
  headers.delete('ETag');
  headers.set('Content-Type', 'text/html; charset=UTF-8');
  headers.set(
    'Cache-Control',
    status === 'error'
      ? 'no-store'
      : 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  );

  if (status !== 'ready' || requestUrl.hostname.endsWith('.pages.dev')) {
    headers.set('X-Robots-Tag', NOINDEX_ROBOTS);
  } else {
    headers.delete('X-Robots-Tag');
  }

  const sourceHtml = await response.text();
  const html = replaceMetadataBlock(
    sourceHtml,
    renderProfileDocumentHead(metadata),
  );

  return new Response(request.method === 'HEAD' ? null : html, {
    status: responseStatus ?? response.status,
    statusText: responseStatus ? undefined : response.statusText,
    headers,
  });
};

export const buildPageNotFoundResponse = async (
  context: AssetResponseContext,
) => {
  const response = await context.next();
  const headers = new Headers(response.headers);

  applySecurityHeaders(headers);

  headers.delete('Content-Length');
  headers.delete('ETag');
  headers.set('Content-Type', 'text/html; charset=UTF-8');
  headers.set(
    'Cache-Control',
    'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
  );
  headers.set('X-Robots-Tag', NOINDEX_ROBOTS);

  const sourceHtml = await response.text();
  const html = replaceMetadataBlock(
    sourceHtml,
    renderPageNotFoundDocumentHead(),
  );

  return new Response(context.request.method === 'HEAD' ? null : html, {
    status: 404,
    headers,
  });
};

export const passThroughResponse = async (
  context: AssetResponseContext,
  noIndex = false,
) => {
  const response = await context.next();
  const headers = new Headers(response.headers);
  const requestUrl = new URL(context.request.url);

  applySecurityHeaders(headers);

  if (noIndex || requestUrl.hostname.endsWith('.pages.dev')) {
    headers.set('X-Robots-Tag', NOINDEX_ROBOTS);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
