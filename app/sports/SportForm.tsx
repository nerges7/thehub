'use client';

import { useState } from 'react';
import { TextField, Button, FormLayout, InlineError } from '@shopify/polaris';
import { addSport, updateSport } from './utils';

interface Props {
  defaultValues?: { id: string; name: string; description?: string };
  onSuccess: () => void;
}

export default function SportForm({ defaultValues, onSuccess }: Props) {
  const [name, setName] = useState(defaultValues?.name || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const data = { name, description };
      if (defaultValues) {
        await updateSport(defaultValues.id, data);
      } else {
        await addSport(data);
      }
      onSuccess();
    } catch (e) {
      setError('Error al guardar el deporte');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormLayout>
      <TextField label="Nombre del deporte" value={name} onChange={setName} autoComplete="off" />
      <TextField
        label="Descripción"
        value={description}
        onChange={setDescription}
        multiline
        autoComplete="off"
      />
      {error && <InlineError message={error} fieldID="name" />}
      <Button onClick={handleSubmit} loading={loading}>
        {defaultValues ? 'Actualizar' : 'Crear'}
      </Button>
    </FormLayout>
  );
}
