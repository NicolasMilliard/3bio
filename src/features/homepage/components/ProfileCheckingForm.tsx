import { THREEBIO_URL } from '@/constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
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
import { ExternalLink } from 'lucide-react';

export const ProfileCheckingForm = () => {
  const inputId = useId();
  const prefixId = `${inputId}-prefix`;
  const errorId = `${inputId}-error`;
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
    const profilePath = `/${encodeURIComponent(values.link)}`;
    window.open(profilePath, '_blank', 'noopener noreferrer');
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex w-full max-w-xl animate-[blurFadeIn_0.8s_ease-out_0.3s_forwards] flex-col gap-2 opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
      >
        <label htmlFor={inputId} className="sr-only">
          Lens profile handle
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup
            className="bg-background h-11"
            aria-invalid={errors.link ? 'true' : 'false'}
          >
            <InputGroupAddon>
              <span id={prefixId}>{THREEBIO_URL}</span>
            </InputGroupAddon>
            <InputGroupInput
              id={inputId}
              placeholder="YourLensHandle"
              aria-invalid={errors.link ? 'true' : 'false'}
              aria-describedby={
                errors.link ? `${prefixId} ${errorId}` : prefixId
              }
              aria-errormessage={errors.link ? errorId : undefined}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              {...register('link')}
            />
          </InputGroup>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Check my Profile
            <span className="sr-only"> (opens in a new tab)</span>
            <ExternalLink aria-hidden="true" />
          </Button>
        </div>
        {errors.link?.message ? (
          <Text
            id={errorId}
            role="alert"
            className="text-destructive px-3 text-sm"
          >
            {errors.link.message}
          </Text>
        ) : null}
      </form>
    </FormProvider>
  );
};
