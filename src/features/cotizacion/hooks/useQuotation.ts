import { useEffect, useState } from 'react';
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
  // Como en el diseño: el primer método y la primera categoría cotizables ya vienen elegidos.
  const data = catalogs.data;
  const rates = config.data;
  useEffect(() => {
    if (!data || !rates) return;
    const method = data.methods.find((item) => rates.ratesByShippingMethod[item.id] > 0);
    const category = data.types.find((item) => rates.multipliersByPackageType[item.id] > 0);
    if (method && !form.getValues('method')) form.setValue('method', String(method.id));
    if (category && !form.getValues('category')) form.setValue('category', String(category.id));
  }, [data, rates, form]);
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
