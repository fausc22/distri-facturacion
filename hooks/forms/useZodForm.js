import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function useZodForm({ schema, defaultValues, mode = 'onChange' }) {
  const form = useForm({
    resolver: zodResolver(schema),
    mode,
    defaultValues,
  });

  const {
    formState: { errors, isValid },
  } = form;

  const errorMap = useMemo(() => errors ?? {}, [errors]);

  return {
    ...form,
    isValid,
    errorMap,
  };
}

export default useZodForm;
