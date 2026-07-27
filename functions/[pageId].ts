import {
  buildProfileDocumentMetadata,
  renderProfileDocumentHead,
  type ProfileMetadataProfile,
  type ProfileMetadataStatus,
} from '../src/features/profile/documentMetadata';

const LENS_API_URL = 'https://api.lens.xyz/graphql';
const THREE_BIO_ATTRIBUTE_KEY = '3bio';
const METADATA_START = '<!-- 3bio-metadata:start -->';
const METADATA_END = '<!-- 3bio-metadata:end -->';
const PROFILE_HANDLE_PATTERN = /^[a-zA-Z0-9._-]+$/;
const RESERVED_PATHS = new Set([
  'dashboard',
  'edit',
  'favicon.ico',
  'favicon.svg',
  'index.html',
  'og.png',
  'robots.txt',
  'sitemap.xml',
]);

const ACCOUNT_QUERY = `
  query Account($request: AccountRequest!) {
    account(request: $request) {
      address
      username {
        localName
      }
      metadata {
        name
        bio
        picture
        coverPicture
        attributes {
          key
          value
        }
      }
    }
  }
`;

type PagesContext = {
  request: Request;
  params: {
    pageId?: string | string[];
  };
  next: () => Promise<Response>;
};

type LensAccount = {
  username?: {
    localName?: string | null;
  } | null;
  metadata?: {
    name?: string | null;
    bio?: string | null;
    picture?: string | null;
    coverPicture?: string | null;
    attributes?: Array<{
      key?: string | null;
      value?: unknown;
    }> | null;
  } | null;
};

type LensAccountResponse = {
  data?: {
    account?: LensAccount | null;
  };
  errors?: unknown[];
};

const getString = (value: unknown) =>
  typeof value === 'string' ? value : undefined;

export const isProfilePageId = (pageId: string) =>
  !RESERVED_PATHS.has(pageId.toLowerCase()) &&
  PROFILE_HANDLE_PATTERN.test(pageId) &&
  /[a-zA-Z0-9]/.test(pageId);

const getProfileLinks = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;

  const links = value.flatMap((link) => {
    if (!link || typeof link !== 'object') return [];

    const record = link as Record<string, unknown>;
    const key = getString(record.key);
    const url = getString(record.value);

    return key && url ? [{ key, value: url }] : [];
  });

  return links.length > 0 ? links : undefined;
};

const parseThreeBioProfile = (value: unknown) => {
  let parsed = value;

  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }

  if (!parsed || typeof parsed !== 'object') return undefined;

  const profile = (parsed as Record<string, unknown>).profile;

  if (!profile || typeof profile !== 'object') return undefined;

  const record = profile as Record<string, unknown>;

  return {
    avatar: getString(record.avatar),
    bio: record.bio === null ? null : getString(record.bio),
    coverPicture: getString(record.coverPicture),
    name: record.name === null ? null : getString(record.name),
    socialLinks: getProfileLinks(record.socialLinks),
  } satisfies ProfileMetadataProfile;
};

export const extractProfileFromLensAccount = (
  account: LensAccount,
): ProfileMetadataProfile => {
  const nativeMetadata = account.metadata;
  const threeBioValue = nativeMetadata?.attributes?.find(
    (attribute) => attribute.key === THREE_BIO_ATTRIBUTE_KEY,
  )?.value;
  const threeBioProfile = parseThreeBioProfile(threeBioValue);

  return {
    avatar: threeBioProfile?.avatar ?? getString(nativeMetadata?.picture),
    bio:
      threeBioProfile?.bio ??
      (nativeMetadata?.bio === null ? null : getString(nativeMetadata?.bio)),
    coverPicture:
      threeBioProfile?.coverPicture ?? getString(nativeMetadata?.coverPicture),
    name:
      threeBioProfile?.name ??
      (nativeMetadata?.name === null ? null : getString(nativeMetadata?.name)),
    socialLinks: threeBioProfile?.socialLinks,
  };
};

const fetchLensAccount = async (lensHandle: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(LENS_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: ACCOUNT_QUERY,
        variables: {
          request: {
            username: {
              localName: lensHandle,
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Lens returned ${response.status}`);
    }

    const result = (await response.json()) as LensAccountResponse;

    if (result.errors?.length) {
      throw new Error('Lens returned a GraphQL error');
    }

    return result.data?.account ?? null;
  } finally {
    clearTimeout(timeout);
  }
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

const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; connect-src 'self' https: wss:; font-src 'self' data:; form-action 'self'; frame-ancestors 'none'; frame-src 'none'; img-src 'self' data: blob: https:; manifest-src 'self'; object-src 'none'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:",
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

const getPublicOrigin = (url: URL) =>
  url.hostname === '3bio.social' || url.hostname === 'www.3bio.social'
    ? 'https://3bio.social'
    : url.origin;

const buildHtmlResponse = async ({
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

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

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
    headers.set('X-Robots-Tag', 'noindex, nofollow');
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

const passThrough = async (context: PagesContext) => {
  const response = await context.next();
  const headers = new Headers(response.headers);
  const requestUrl = new URL(context.request.url);

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  if (requestUrl.hostname.endsWith('.pages.dev')) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const onRequest = async (context: PagesContext) => {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return passThrough(context);
  }

  const pageId = context.params.pageId;

  if (typeof pageId !== 'string') {
    return passThrough(context);
  }

  let decodedPageId: string;

  try {
    decodedPageId = decodeURIComponent(pageId);
  } catch {
    return passThrough(context);
  }

  if (!isProfilePageId(decodedPageId)) {
    return passThrough(context);
  }

  const normalizedHandle = decodedPageId.toLowerCase();
  const requestUrl = new URL(context.request.url);
  const canonicalOrigin = getPublicOrigin(requestUrl);
  const canonicalPath = `/${encodeURIComponent(normalizedHandle)}`;

  if (
    requestUrl.pathname !== canonicalPath ||
    requestUrl.origin !== canonicalOrigin
  ) {
    const canonicalUrl = new URL(canonicalPath, canonicalOrigin);
    canonicalUrl.search = requestUrl.search;

    return new Response(null, {
      status: 308,
      headers: {
        ...securityHeaders,
        Location: canonicalUrl.toString(),
        ...(requestUrl.hostname.endsWith('.pages.dev')
          ? { 'X-Robots-Tag': 'noindex, nofollow' }
          : {}),
      },
    });
  }

  const shellResponse = await context.next();

  try {
    const account = await fetchLensAccount(normalizedHandle);

    if (!account) {
      return buildHtmlResponse({
        response: shellResponse,
        request: context.request,
        lensHandle: normalizedHandle,
        status: 'not-found',
        responseStatus: 404,
      });
    }

    return buildHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: account.username?.localName ?? normalizedHandle,
      profile: extractProfileFromLensAccount(account),
      status: 'ready',
    });
  } catch {
    return buildHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: normalizedHandle,
      status: 'error',
      responseStatus: 503,
    });
  }
};
