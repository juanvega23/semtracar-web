import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppConfig } from '@/lib/appConfig';
import { usePackageCatalogs } from '@/features/paquetes';
import { calculateQuotation, quotationSchema, type QuotationInput } from '../services/quotationService';

export function useQuotation() {
  const config = useAppConfig();
  const catalogs = usePackageCatalogs();
  const [result, setResult] = useState<ReturnType<typeof calculateQuotation> | null>(null);
  const form = useForm<QuotationInput, unknown, ReturnType<typeof quotationSchema.parse>>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { weight: '', method: '', category: '' },
  });
  const submit = form.handleSubmit((values) => {
    if (!config.data) return;
    try {
      setResult(
        calculateQuotation(values.weight, Number(values.method), Number(values.category), config.data),
      );
    } catch (error) {
      form.setError('root', {
        message: error instanceof Error ? error.message : 'No se pudo calcular la cotización.',
      });
    }
  });
  return { form, result, clearResult: () => setResult(null), submit, config, catalogs };
}
