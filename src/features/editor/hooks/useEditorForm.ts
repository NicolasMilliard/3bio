import { zodResolver } from '@hookform/resolvers/zod';
import type { Account } from '@lens-protocol/react';
import { useForm, type SubmitErrorHandler } from 'react-hook-form';
import { toast } from 'sonner';

import type { ThreeBioMetadata } from '@/schemas/threeBioMetadata.schema';
import { buildEditorFormDefaultValues } from '../helpers/editorFormValues';
import {
  metadataFormSchema,
  type MetadataFormValues,
} from '../schemas/metadataForm.schema';
import { useEditorSave } from './useEditorSave';

export function useEditorForm(
  account: Account,
  threeBioMetadata: ThreeBioMetadata,
) {
  const methods = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: buildEditorFormDefaultValues(threeBioMetadata),
  });
  const { onSubmit } = useEditorSave({ account, methods });

  const onInvalid: SubmitErrorHandler<MetadataFormValues> = (errors) => {
    const hasLinkError = Boolean(errors.links || errors.socialLinks);

    toast.error(
      hasLinkError ? 'Check your profile links' : 'Check your profile details',
      {
        description: hasLinkError
          ? 'Use complete HTTP or HTTPS URLs that match the selected platform.'
          : 'Correct the invalid fields before saving.',
      },
    );
  };

  return { methods, onSubmit, onInvalid };
}
