import {
  buildCanonicalRedirectResponse,
  buildPageNotFoundResponse,
  buildProfileHtmlResponse,
  passThroughResponse,
} from '../src/features/profile/edge/htmlResponse';
import {
  extractProfileFromLensAccount,
  fetchLensAccount,
} from '../src/features/profile/edge/lensAccount';
import {
  decodePathSegments,
  getCanonicalProfileUrl,
  isInternalAppPath,
  isProfilePageId,
} from '../src/features/profile/edge/routing';

type PagesContext = {
  request: Request;
  params: {
    path?: string | string[];
  };
  next: () => Promise<Response>;
};

export const onRequest = async (context: PagesContext) => {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return passThroughResponse(context);
  }

  const requestUrl = new URL(context.request.url);

  if (isInternalAppPath(requestUrl.pathname)) {
    return passThroughResponse(context, true);
  }

  const pathSegments = decodePathSegments(context.params.path);

  if (!pathSegments || pathSegments.length !== 1) {
    return buildPageNotFoundResponse(context);
  }

  const [decodedPageId] = pathSegments;

  if (!isProfilePageId(decodedPageId)) {
    return buildPageNotFoundResponse(context);
  }

  const normalizedHandle = decodedPageId.toLowerCase();
  const canonicalUrl = getCanonicalProfileUrl(requestUrl, normalizedHandle);

  if (canonicalUrl) {
    return buildCanonicalRedirectResponse(requestUrl, canonicalUrl);
  }

  const shellResponse = await context.next();

  try {
    const account = await fetchLensAccount(normalizedHandle);

    if (!account) {
      return buildProfileHtmlResponse({
        response: shellResponse,
        request: context.request,
        lensHandle: normalizedHandle,
        status: 'not-found',
        responseStatus: 404,
      });
    }

    return buildProfileHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: account.username?.localName ?? normalizedHandle,
      profile: extractProfileFromLensAccount(account),
      status: 'ready',
    });
  } catch {
    return buildProfileHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: normalizedHandle,
      status: 'error',
      responseStatus: 503,
    });
  }
};
