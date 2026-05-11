import { FormProvider } from 'react-hook-form';
import { useEditorContext } from '../context/editor.context';
import { useEditorForm } from '../hooks/useEditorForm';

export const EditorForm = ({ children }: { children: React.ReactNode }) => {
  const { account, inBioMetadata } = useEditorContext();
  const { methods, onSubmit } = useEditorForm(account, inBioMetadata);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
};
