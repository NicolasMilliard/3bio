import {
  StorageClient,
  type AclConfig,
} from '@lens-chain/storage-client';

import { validateImageUpload } from '../schemas/imageUpload.schema';
import type { MetadataFormValues } from '../schemas/metadataForm.schema';

export const EDITOR_IMAGE_FIELDS = [
  'avatar',
  'coverPicture',
  'linksPanelBackground',
] as const;

export type EditorImageField = (typeof EDITOR_IMAGE_FIELDS)[number];
export type EditorImageValues = Pick<MetadataFormValues, EditorImageField>;
export type EditorImageErrors = Partial<Record<EditorImageField, string>>;

type ValidateEditorImagesDependencies = {
  validateImageUpload: (file: File) => Promise<string | null>;
};

type UploadEditorImagesDependencies = {
  uploadFile: (
    file: File,
    options: { acl: AclConfig },
  ) => Promise<{ gatewayUrl: string }>;
};

type UploadEditorImagesInput = {
  values: EditorImageValues;
  acl: AclConfig;
  onUploadStart?: (field: EditorImageField) => void;
  onUploaded?: (field: EditorImageField, uri: string) => void;
  dependencies?: UploadEditorImagesDependencies;
};

export type EditorImageUris = {
  avatarUri: string | null | undefined;
  coverPictureUri: string | null | undefined;
  linksPanelBackgroundUri: string | null | undefined;
};

// Singleton: intentionally created once so callers do not instantiate a storage
// client for every validation or upload pass.
const storageClient = StorageClient.create();

const defaultValidationDependencies: ValidateEditorImagesDependencies = {
  validateImageUpload,
};

const defaultUploadDependencies: UploadEditorImagesDependencies = {
  uploadFile: (file, options) => storageClient.uploadFile(file, options),
};

export const validateEditorImages = async (
  values: EditorImageValues,
  dependencies: ValidateEditorImagesDependencies =
    defaultValidationDependencies,
) => {
  const errors: EditorImageErrors = {};

  for (const field of EDITOR_IMAGE_FIELDS) {
    const file = values[field].file;

    if (!file) continue;

    const error = await dependencies.validateImageUpload(file);

    if (error) errors[field] = error;
  }

  return errors;
};

export const uploadEditorImages = async ({
  values,
  acl,
  onUploadStart,
  onUploaded,
  dependencies = defaultUploadDependencies,
}: UploadEditorImagesInput): Promise<EditorImageUris> => {
  const uris: Record<EditorImageField, string | null | undefined> = {
    avatar: values.avatar.preview,
    coverPicture: values.coverPicture.preview,
    linksPanelBackground: values.linksPanelBackground.preview,
  };

  for (const field of EDITOR_IMAGE_FIELDS) {
    const file = values[field].file;

    if (!file) continue;

    onUploadStart?.(field);
    const upload = await dependencies.uploadFile(file, { acl });
    uris[field] = upload.gatewayUrl;
    onUploaded?.(field, upload.gatewayUrl);
  }

  return {
    avatarUri: uris.avatar,
    coverPictureUri: uris.coverPicture,
    linksPanelBackgroundUri: uris.linksPanelBackground,
  };
};
