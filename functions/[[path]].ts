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
import {
  getProfilePublicationDecision,
  readProfilePublicationState,
} from '../src/features/profile/publication';

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

  const buildUnavailableProfileResponse = () =>
    buildProfileHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: normalizedHandle,
      status: 'not-found',
      responseStatus: 404,
    });

  try {
    if (
      !getProfilePublicationDecision({ lensHandle: normalizedHandle }).isPublic
    ) {
      return buildUnavailableProfileResponse();
    }

    const account = await fetchLensAccount(normalizedHandle);

    if (!account) {
      return buildUnavailableProfileResponse();
    }

    const accountHandle = account.username?.localName ?? normalizedHandle;
    const publicationState = readProfilePublicationState(
      account.metadata?.attributes,
    );
    const publicationDecision = getProfilePublicationDecision({
      accountAddress: account.address,
      hasUnsupportedSchemaVersion:
        publicationState.hasUnsupportedSchemaVersion,
      lensHandle: accountHandle,
      publicationStatus: publicationState.status,
    });

    if (!publicationDecision.isPublic) {
      return buildUnavailableProfileResponse();
    }

    return buildProfileHtmlResponse({
      response: shellResponse,
      request: context.request,
      lensHandle: accountHandle,
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
