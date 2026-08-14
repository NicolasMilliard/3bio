import { LENS_METADATA_RESPONSE_MAX_BYTES } from '../../../constants/metadata';
import {
  hasThreeBioMetadataTombstone,
  parseThreeBioMetadataAttributes,
} from '../../../helpers/parseThreeBioMetadata';
import type { ProfileMetadataProfile } from '../documentMetadata';

const LENS_API_URL = 'https://api.lens.xyz/graphql';
const LENS_REQUEST_TIMEOUT_MS = 5_000;

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

export type LensAccount = {
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

export const extractProfileFromLensAccount = (
  account: LensAccount,
): ProfileMetadataProfile => {
  const nativeMetadata = account.metadata;
  const threeBioMetadata = parseThreeBioMetadataAttributes(
    nativeMetadata?.attributes,
  );
  const threeBioProfile = threeBioMetadata?.profile;
  const hasTombstone = (
    path: Parameters<typeof hasThreeBioMetadataTombstone>[1],
  ) => hasThreeBioMetadataTombstone(threeBioMetadata, path);

  return {
    avatar: hasTombstone('profile.avatar')
      ? undefined
      : (threeBioProfile?.avatar ?? getString(nativeMetadata?.picture)),
    bio: hasTombstone('profile.bio')
      ? null
      : (threeBioProfile?.bio ??
        (nativeMetadata?.bio === null ? null : getString(nativeMetadata?.bio))),
    coverPicture: hasTombstone('profile.coverPicture')
      ? undefined
      : (threeBioProfile?.coverPicture ??
        getString(nativeMetadata?.coverPicture)),
    name: hasTombstone('profile.name')
      ? null
      : (threeBioProfile?.name ??
        (nativeMetadata?.name === null
          ? null
          : getString(nativeMetadata?.name))),
    socialLinks: hasTombstone('profile.socialLinks')
      ? undefined
      : threeBioProfile?.socialLinks?.map(({ key, value }) => ({ key, value })),
  };
};

const readLensResponseText = async (response: Response) => {
  const contentLength = response.headers.get('Content-Length');

  if (
    contentLength !== null &&
    Number(contentLength) > LENS_METADATA_RESPONSE_MAX_BYTES
  ) {
    throw new Error('Lens response exceeded the metadata size limit');
  }

  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let responseText = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    receivedBytes += value.byteLength;

    if (receivedBytes > LENS_METADATA_RESPONSE_MAX_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error('Lens response exceeded the metadata size limit');
    }

    responseText += decoder.decode(value, { stream: true });
  }

  return responseText + decoder.decode();
};

export const fetchLensAccount = async (lensHandle: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LENS_REQUEST_TIMEOUT_MS);

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

    const responseText = await readLensResponseText(response);
    const result = JSON.parse(responseText) as LensAccountResponse;

    if (result.errors?.length) {
      throw new Error('Lens returned a GraphQL error');
    }

    return result.data?.account ?? null;
  } finally {
    clearTimeout(timeout);
  }
};
