import { useEffect, useState } from 'react';
import { api } from '@/services/apiClient';
import type { ModuleField } from '@/features/resources/config/modules';

export type SelectOption = {
  value: string;
  label: string;
};

export function useSelectOptions(fields: ModuleField[]) {
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});

  useEffect(() => {
    const dynamicFields = fields.filter((field) => field.type === 'select' && field.optionsEndpoint);
    if (!dynamicFields.length) {
      setOptions({});
      return;
    }

    let active = true;

    const loadOptions = async () => {
      const loadedOptions: Record<string, SelectOption[]> = {};
      await Promise.all(
        dynamicFields.map(async (field) => {
          try {
            const response = await api.get(field.optionsEndpoint!, { params: { limit: 100 } });
            const items = response.data?.data ?? [];
            const parsedOptions = Array.isArray(items)
              ? items.map((item: any) => {
                  const value = String(field.optionValueKey ? item[field.optionValueKey] : item.id ?? item._id ?? '');
                  const labelKey = field.optionLabelKey ?? 'name';
                  const label = String(labelKey.split('.').reduce((acc: any, pathPart) => acc?.[pathPart], item) ?? value);
                  return { value, label };
                })
              : [];
            loadedOptions[field.name] = parsedOptions;
          } catch {
            loadedOptions[field.name] = [];
          }
        })
      );

      if (active) {
        setOptions(loadedOptions);
      }
    };

    loadOptions();

    return () => {
      active = false;
    };
  }, [fields]);

  return options;
}
