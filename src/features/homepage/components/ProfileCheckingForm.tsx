import { INBIO_URL } from '@/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import {
  type ProfileCheckingFormValues,
  profileCheckingFormSchema,
} from '../schema/profileCheckingForm.schema';

import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Text,
} from '@/components/ui';

export const ProfileCheckingForm = () => {
  const methods = useForm<ProfileCheckingFormValues>({
    resolver: zodResolver(profileCheckingFormSchema),
    defaultValues: {
      link: '',
    },
  });

  const {
    formState: { errors },
    register,
  } = methods;

  const onSubmit = (values: ProfileCheckingFormValues) => {
    const profilePath = values.link;
    window.open(profilePath, '_blank', 'noopener,noreferrer');
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex max-w-97 animate-[blurFadeIn_0.8s_ease-out_0.3s_forwards] flex-col gap-2 opacity-0"
      >
        <div className="flex gap-2">
          <InputGroup
            className="bg-background"
            aria-invalid={errors.link ? 'true' : 'false'}
          >
            <InputGroupAddon>
              <span>{INBIO_URL}</span>
            </InputGroupAddon>
            <InputGroupInput
              placeholder="YourLensHandle"
              aria-invalid={errors.link ? 'true' : 'false'}
              {...register('link')}
            />
          </InputGroup>
          <Button type="submit">Check my Profile</Button>
        </div>
        {errors.link?.message ? (
          <Text className="text-destructive px-3 text-sm">
            {errors.link.message}
          </Text>
        ) : null}
      </form>
    </FormProvider>
  );
};
