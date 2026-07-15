import { expect, test } from 'bun:test';
import { MetadataAttributeType } from '@lens-protocol/metadata';
import {
  MetadataAttributeType as ApiMetadataAttributeType,
} from '@lens-protocol/react';

import { THREEBIO_ATTRIBUTE_KEY } from '../src/constants/attributes.ts';
import { formatMetadataBeforeUpload } from '../src/helpers/formatMetadataBeforeUpload.ts';

test('preserves native Lens metadata while upserting the 3bio attribute', () => {
  const nextThreeBioMetadata = {
    theme: {
      name: 'midnight',
      displayStatistics: false,
      displayBranding: true,
    },
  };

  const lensAccount = {
    metadata: {
      __typename: 'AccountMetadata',
      id: 'existing-metadata-id',
      name: 'Alice',
      bio: 'Native Lens bio',
      picture: 'https://example.com/avatar.png',
      coverPicture: 'https://example.com/cover.png',
      attributes: [
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.String,
          key: 'existing-native-attribute',
          value: 'keep-me',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Boolean,
          key: 'existing-boolean-attribute',
          value: 'true',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Date,
          key: 'existing-date-attribute',
          value: '2026-07-15T00:00:00.000Z',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Number,
          key: 'existing-number-attribute',
          value: '42',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Json,
          key: 'existing-json-attribute',
          value: '{"keep":true}',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Json,
          key: THREEBIO_ATTRIBUTE_KEY,
          value: '{"old":1}',
        },
        {
          __typename: 'MetadataAttribute',
          type: ApiMetadataAttributeType.Json,
          key: THREEBIO_ATTRIBUTE_KEY,
          value: '{"old":2}',
        },
      ],
    },
  };

  const result = formatMetadataBeforeUpload(
    lensAccount,
    nextThreeBioMetadata,
  );

  expect(result.lens.name).toBe('Alice');
  expect(result.lens.bio).toBe('Native Lens bio');
  expect(result.lens.picture).toBe('https://example.com/avatar.png');
  expect(result.lens.coverPicture).toBe('https://example.com/cover.png');

  const attributes = result.lens.attributes ?? [];

  expect(
    attributes.find(({ key }) => key === 'existing-native-attribute'),
  ).toEqual({
    type: MetadataAttributeType.STRING,
    key: 'existing-native-attribute',
    value: 'keep-me',
  });

  expect(
    attributes.find(({ key }) => key === 'existing-boolean-attribute'),
  ).toEqual({
    type: MetadataAttributeType.BOOLEAN,
    key: 'existing-boolean-attribute',
    value: 'true',
  });

  expect(
    attributes.find(({ key }) => key === 'existing-date-attribute'),
  ).toEqual({
    type: MetadataAttributeType.DATE,
    key: 'existing-date-attribute',
    value: '2026-07-15T00:00:00.000Z',
  });

  expect(
    attributes.find(({ key }) => key === 'existing-number-attribute'),
  ).toEqual({
    type: MetadataAttributeType.NUMBER,
    key: 'existing-number-attribute',
    value: '42',
  });

  expect(
    attributes.find(({ key }) => key === 'existing-json-attribute'),
  ).toEqual({
    type: MetadataAttributeType.JSON,
    key: 'existing-json-attribute',
    value: '{"keep":true}',
  });

  expect(
    attributes.filter(({ key }) => key === THREEBIO_ATTRIBUTE_KEY),
  ).toEqual([
    {
      type: MetadataAttributeType.JSON,
      key: THREEBIO_ATTRIBUTE_KEY,
      value: JSON.stringify(nextThreeBioMetadata),
    },
  ]);
});
