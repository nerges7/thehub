'use client';

import { useEffect, useState } from 'react';
import { TextField, Button, FormLayout, InlineError, OptionList } from '@shopify/polaris';
import { addCategory, updateCategory } from './utils';
import { getSports } from '../sports/utils';

interface Props {
  defaultValues?: {
    id: string;
    name: string;
    description?: string;
    sportIds: string[];
  };
  onSuccess: () => void;
}

export default function CategoryForm({ defaultValues, onSuccess }: Props) {
  const [name, setName] = useState(defaultValues?.name || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [sportIds, setSportIds] = useState<string[]>(defaultValues?.sportIds || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sports, setSports] = useState<any[]>([]);

  useEffect(() => {
    getSports().then(setSports);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    const data = { name, description, sportIds };
    try {
      if (defaultValues) {
        await updateCategory(defaultValues.id, data);
      } else {
        await addCategory(data);
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      setError('Error al guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMulti = (value: string[]) => {
    setSportIds(value);
  };

  return (
    <FormLayout>
      <TextField label="Nombre" value={name} onChange={setName} autoComplete="off" />
      <TextField
        label="Descripción"
        value={description}
        onChange={setDescription}
        multiline
        autoComplete="off"
      />
     <OptionList
  title="Deportes relacionados"
  allowMultiple
  onChange={(selected) => setSportIds(selected)}
  selected={sportIds}
  options={sports.map((s) => ({
    label: s.name,
    value: s.id,
  }))}
/>


      {error && <InlineError message={error} fieldID="name" />}
      <Button onClick={handleSubmit} loading={loading}>
        {defaultValues ? 'Actualizar' : 'Crear'}
      </Button>
    </FormLayout>
  );
}
