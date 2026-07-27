import { expect, test } from 'bun:test';

import { getMetadataUploadCacheKey } from '../src/features/editor/helpers/metadataUploadCache.ts';
import { getSaveErrorFeedback } from '../src/features/editor/helpers/saveErrorFeedback.ts';

test('reports the failed upload stage instead of inspecting error text', () => {
  expect(getSaveErrorFeedback('uploading-avatar').title).toBe(
    'Avatar upload failed',
  );
  expect(getSaveErrorFeedback('uploading-social-image').title).toBe(
    'Social image upload failed',
  );
  expect(getSaveErrorFeedback('uploading-profile-data').title).toBe(
    'Profile data upload failed',
  );
});

test('warns that an interrupted confirmation may already be live', () => {
  expect(getSaveErrorFeedback('confirming-transaction').description).toContain(
    'Check your public profile before trying again',
  );
});

test('metadata retry keys stay stable until the draft changes', () => {
  const previousMetadata = {
    name: 'Native Lens name',
    attributes: [{ key: 'existing', type: 'String', value: 'preserve me' }],
  };
  const draft = {
    profile: { name: 'Alice', bio: 'Hello' },
    theme: { name: 'bubblegum' },
  };

  const firstKey = getMetadataUploadCacheKey(previousMetadata, draft);
  const retryKey = getMetadataUploadCacheKey(previousMetadata, draft);
  const changedDraftKey = getMetadataUploadCacheKey(previousMetadata, {
    ...draft,
    profile: { ...draft.profile, bio: 'Changed' },
  });

  expect(retryKey).toBe(firstKey);
  expect(changedDraftKey).not.toBe(firstKey);
});
