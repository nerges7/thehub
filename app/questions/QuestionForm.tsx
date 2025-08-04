'use client';

import { useEffect, useState } from 'react';
import { TextField, Select, Button, Checkbox, Icon } from '@shopify/polaris';
import { PlusCircleIcon, MinusCircleIcon } from '@shopify/polaris-icons';
import { getSports } from '../sports/utils';
import { addQuestion, updateQuestion, getQuestions } from './utils';
import { Sport, Question } from '@/types';
import { generateKeyFromText } from '@/utils/slugify';
import RichText from '@/components/RichText';
import { stripHtml } from '@/utils/stripHtml';

interface Props {
  defaultValues?: Question;
  onSuccess: () => void;
  onClose: () => void;
}

export default function QuestionForm({ defaultValues, onSuccess, onClose }: Props) {
  const [sports, setSports] = useState<Sport[]>([]);
  const [text, setText] = useState(defaultValues?.text || '');
  const [key, setKey] = useState(defaultValues?.key || '');
  const [type, setType] = useState<'text' | 'number' | 'select' | 'time'>(defaultValues?.type || 'text');
  const [optionsList, setOptionsList] = useState<string[]>(defaultValues?.options || []);
  const [unit, setUnit] = useState(defaultValues?.unit || '');
  const [forAllSports, setForAllSports] = useState(defaultValues?.forAllSports || false);
  const [selectedSports, setSelectedSports] = useState<string[]>(
    defaultValues?.sports?.map((s) => s.sportId) || []
  );

  useEffect(() => {
    getSports().then(setSports);
  }, []);

  useEffect(() => {
    if (!defaultValues) {
      setKey(generateKeyFromText(stripHtml(text)));
    }
  }, [text]);

  const handleSubmit = async () => {
    const basePayload: any = {
      text,
      key,
      type,
      forAllSports,
      ...(type === 'select' && {
        options: optionsList.map((opt) => opt.trim()).filter(Boolean),
      }),
      ...(type === 'number' ? { unit } : {}),
    };

    if (defaultValues?.id) {
      const payload = {
        ...basePayload,
        ...(forAllSports
          ? { sports: undefined }
          : {
              sports: selectedSports.map((sportId, i) => ({
                sportId,
                order: defaultValues?.sports?.find((s) => s.sportId === sportId)?.order ?? i,
              })),
            }),
      };
      await updateQuestion(defaultValues.id, payload);
    } else {
      const existing = await getQuestions();
      const payload = {
        ...basePayload,
        ...(forAllSports
          ? { sports: undefined }
          : {
              sports: selectedSports.map((sportId) => {
                const sportQuestions = existing.filter((q) =>
                  q.sports?.some((s) => s.sportId === sportId)
                );
                const maxOrder = sportQuestions.length
                  ? Math.max(...sportQuestions.map((q) => q.sports?.find((s) => s.sportId === sportId)?.order ?? 0))
                  : -1;
                return { sportId, order: maxOrder + 1 };
              }),
            }),
      };

      await addQuestion(payload);
    }

    onSuccess();
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...optionsList];
    updated[index] = value;
    setOptionsList(updated);
  };

  const addOption = () => {
    setOptionsList([...optionsList, '']);
  };

  const removeOption = (index: number) => {
    setOptionsList(optionsList.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <RichText value={text} onChange={setText} />

      <TextField
        label="Clave interna (key)"
        helpText="Se genera automáticamente desde el texto. Puedes modificarla si lo deseas."
        value={key}
        onChange={setKey}
        autoComplete="off"
      />

      <Select
        label="Tipo de pregunta"
        options={[
          { label: 'Texto', value: 'text' },
          { label: 'Número', value: 'number' },
          { label: 'Selección', value: 'select' },
          { label: 'Tiempo (horas y minutos)', value: 'time' },
        ]}
        value={type}
        onChange={(val) => setType(val as 'text' | 'number' | 'select' | 'time')}
      />

      {type === 'number' && (
        <TextField
          label="Unidad (ej. km, mi, mt)"
          value={unit}
          onChange={setUnit}
          autoComplete="off"
        />
      )}

      {type === 'select' && (
        <div className="space-y-2">
          <label className="font-medium text-sm text-gray-700">Opciones</label>
          {optionsList.map((opt, index) => (
            <div key={index} className="flex gap-2 items-center">
              <TextField
                labelHidden
                label={`Opción ${index + 1}`}
                value={opt}
                onChange={(val) => updateOption(index, val)}
                autoComplete="off"
              />
              <Button
                icon={MinusCircleIcon}
                onClick={() => removeOption(index)}
                tone="critical"
              />
            </div>
          ))}
          <Button icon={PlusCircleIcon} onClick={addOption}>
            Agregar opción
          </Button>
        </div>
      )}

      <Checkbox
        label="Pregunta general (para todos los deportes)"
        checked={forAllSports}
        onChange={setForAllSports}
      />

      {!forAllSports && (
        <Select
          label="Deportes"
          options={sports.map((s) => ({ label: s.name, value: s.id }))}
          value=""
          onChange={(value) => {
            if (!selectedSports.includes(value)) {
              setSelectedSports([...selectedSports, value]);
            }
          }}
        />
      )}

      {!forAllSports && selectedSports.length > 0 && (
        <ul className="space-y-2">
          {selectedSports.map((id) => {
            const sport = sports.find((s) => s.id === id);
            return (
              <li key={id} className="flex justify-between items-center border p-2 rounded">
                <span>{sport?.name || id}</span>
                <Button tone="critical" onClick={() => setSelectedSports(selectedSports.filter((s) => s !== id))}>
                  Quitar
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          {defaultValues ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </div>
  );
}
