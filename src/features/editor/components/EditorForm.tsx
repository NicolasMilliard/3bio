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
  const navigation = usePreventNavigation({
    enabled: isDirty,
  });

  return (
    <>
      <FormProvider {...methods}>
        <form
          id="profile-editor-form"
          className="min-h-dvh w-full"
          aria-busy={isSubmitting}
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
        onCancel={navigation.cancelNavigation}
        onConfirm={navigation.confirmNavigation}
      />
    </>
  );
};
