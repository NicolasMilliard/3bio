import { type InBioMetadata } from '@/schemas/inBioMetadata.schema';
import { type Account } from '@lens-protocol/client';
import { FormProvider } from 'react-hook-form';
import { useEditorForm } from '../hooks/useEditorForm';

export const EditorForm = ({
  account,
  inBioMetadata,
  children,
}: {
  account: Account;
  inBioMetadata: InBioMetadata;
  children: React.ReactNode;
}) => {
  const { methods, onSubmit } = useEditorForm(account, inBioMetadata);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};
