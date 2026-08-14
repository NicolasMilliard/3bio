import { expect, test } from 'bun:test';

import {
  uploadEditorImages,
  validateEditorImages,
} from '../src/features/editor/services/prepareEditorImages.ts';

const acl = {
  template: 'lens_account',
  lensAccount: '0x1111111111111111111111111111111111111111',
  chainId: 232,
};

const image = (name) => new File([name], name, { type: 'image/png' });

const values = (overrides = {}) => ({
  avatar: { preview: 'https://images.example/avatar.png' },
  coverPicture: { preview: 'https://images.example/cover.png' },
  linksPanelBackground: {
    preview: 'https://images.example/panel.png',
  },
  ...overrides,
});

test('image validation checks selected files and returns only field errors', async () => {
  const avatar = image('avatar.png');
  const panel = image('panel.png');
  const validated = [];

  const errors = await validateEditorImages(
    values({
      avatar: { file: avatar, preview: 'blob:avatar' },
      linksPanelBackground: { file: panel, preview: 'blob:panel' },
    }),
    {
      validateImageUpload: async (file) => {
        validated.push(file.name);
        return file === avatar ? 'Avatar is invalid.' : null;
      },
    },
  );

  expect(validated).toEqual(['avatar.png', 'panel.png']);
  expect(errors).toEqual({ avatar: 'Avatar is invalid.' });
  expect(errors).not.toHaveProperty('coverPicture');
  expect(errors).not.toHaveProperty('linksPanelBackground');
});

test('uploading with no selected files performs no uploads and keeps previews', async () => {
  let uploadCalls = 0;

  const result = await uploadEditorImages({
    values: values(),
    acl,
    dependencies: {
      uploadFile: async () => {
        uploadCalls += 1;
        return { gatewayUrl: 'https://images.example/unexpected.png' };
      },
    },
  });

  expect(uploadCalls).toBe(0);
  expect(result).toEqual({
    avatarUri: 'https://images.example/avatar.png',
    coverPictureUri: 'https://images.example/cover.png',
    linksPanelBackgroundUri: 'https://images.example/panel.png',
  });
});

test('selected images upload sequentially with immediate progress callbacks', async () => {
  const avatar = image('avatar.png');
  const cover = image('cover.png');
  const events = [];

  const result = await uploadEditorImages({
    values: values({
      avatar: { file: avatar, preview: 'blob:avatar' },
      coverPicture: { file: cover, preview: 'blob:cover' },
    }),
    acl,
    onUploadStart: (field) => events.push(`start:${field}`),
    onUploaded: (field, uri) => events.push(`uploaded:${field}:${uri}`),
    dependencies: {
      uploadFile: async (file, options) => {
        events.push(`upload:${file.name}`);
        expect(options).toEqual({ acl });
        return { gatewayUrl: `https://gateway.example/${file.name}` };
      },
    },
  });

  expect(events).toEqual([
    'start:avatar',
    'upload:avatar.png',
    'uploaded:avatar:https://gateway.example/avatar.png',
    'start:coverPicture',
    'upload:cover.png',
    'uploaded:coverPicture:https://gateway.example/cover.png',
  ]);
  expect(result).toEqual({
    avatarUri: 'https://gateway.example/avatar.png',
    coverPictureUri: 'https://gateway.example/cover.png',
    linksPanelBackgroundUri: 'https://images.example/panel.png',
  });
});
