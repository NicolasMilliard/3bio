import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import type { Account } from '@lens-protocol/react';
import { usePreventNavigation } from '../hooks';
import { useEditorForm } from '../hooks/useEditorForm';

import { FormProvider } from 'react-hook-form';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';

export const EditorForm = ({
  account,
  threeBioMetadata,
  children,
}: {
  account: Account;
  threeBioMetadata: ThreeBioMetadata;
  children: React.ReactNode;
}) => {
  const { methods, onSubmit, onInvalid } = useEditorForm(
    account,
    threeBioMetadata,
  );

  const {
    formState: { isDirty, isSubmitting },
  } = methods;
  const imageValidation = methods.watch('_imageValidation');
  const isCheckingImage =
    imageValidation.avatar || imageValidation.coverPicture;
  const navigation = usePreventNavigation({
    enabled: isDirty || isSubmitting || isCheckingImage,
    message: isSubmitting
      ? 'Your profile is still saving. Wait for it to finish before leaving.'
      : isCheckingImage
        ? 'Your image is still being checked. Wait for it to finish before leaving.'
        : undefined,
  });

  return (
    <>
      <FormProvider {...methods}>
        <form
          id="profile-editor-form"
          className="min-h-dvh w-full"
          aria-busy={isSubmitting || isCheckingImage}
          onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
        >
          <fieldset
            disabled={isSubmitting}
            className="m-0 w-full min-w-0 border-0 p-0"
          >
            {children}
          </fieldset>
        </form>
      </FormProvider>
      <UnsavedChangesDialog
        open={navigation.open}
        isSaving={isSubmitting}
        isCheckingImage={isCheckingImage}
        onCancel={navigation.cancelNavigation}
        onConfirm={navigation.confirmNavigation}
      />
    </>
  );
};
