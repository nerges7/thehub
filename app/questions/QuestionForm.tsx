'use client';

import { useEffect, useState } from 'react';
import { TextField, Select, Button, Checkbox, Icon, Text, ChoiceList, Card } from '@shopify/polaris';
import {PlusCircleIcon, MinusCircleIcon} from '@shopify/polaris-icons';
import { getSports } from '../sports/utils';
import { addQuestion, updateQuestion, getQuestions } from './utils';
import { Sport, Question } from '@/types';
import { generateKeyFromText } from '@/utils/slugify';
import RichText from '@/components/RichText'
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
  const [type, setType] = useState<'text' | 'number' | 'select' | 'time' | 'distance' | 'multitime'>(defaultValues?.type || 'text');
  const [selectedSports, setSelectedSports] = useState<{sportId: string, order: number}[]>(defaultValues?.sports || []);
  const [optionsList, setOptionsList] = useState<string[]>(defaultValues?.options || []);
  const [unit, setUnit] = useState(defaultValues?.unit || '');
  const [forAllSports, setForAllSports] = useState(defaultValues?.forAllSports || false);
  const [timeComponents, setTimeComponents] = useState<{label: string, key: string}[]>(
  defaultValues?.timeComponents || []
);

  useEffect(() => {
    getSports().then(setSports);
  }, []);

  useEffect(() => {
  if (defaultValues?.timeComponents) {
    setTimeComponents(defaultValues.timeComponents);
  }
}, [defaultValues]);
  useEffect(() => {
    if (!defaultValues) {
      setKey(generateKeyFromText(stripHtml(text)));
    }
  }, [text]);

   const handleSubmit = async () => {
    const payload: Omit<Question, 'id'> = {
      text,
      key,
      type,
      sports: forAllSports 
        ? sports.map(sport => ({ sportId: sport.id, order: 0 }))
        : selectedSports,
      ...(type === 'select' && {
        options: optionsList.map((opt) => opt.trim()).filter(Boolean),
      }),
      ...(type === 'multitime' && { 
      timeComponents
    }),
      ...(type === 'number' ? { unit } : {}),
      forAllSports
    };

    // Eliminar options si está vacío
    if (payload.options && payload.options.length === 0) {
      delete payload.options;
    }

    if (defaultValues?.id) {
      await updateQuestion(defaultValues.id, payload);
    } else {
      // Calcular orden para cada deporte seleccionado
      const existingQuestions = await getQuestions();
      const payloadWithOrders = {
  ...payload,
  sports: (payload.sports || []).map(sport => {
    const questionsForSport = existingQuestions.filter(q => 
      q.sports?.some(s => s.sportId === sport.sportId)
    );
    
    const maxOrder = questionsForSport.reduce((max, q) => {
      const sportOrder = q.sports?.find(s => s.sportId === sport.sportId)?.order || 0;
      return Math.max(max, sportOrder);
    }, -1);
    
    return {
      sportId: sport.sportId,
      order: maxOrder + 1
    };
  })
};

      await addQuestion(payloadWithOrders);
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
       <RichText
  value={text}
  onChange={setText}
/>

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
          { label: 'Multi-tiempo', value: 'multitime' },
          { label: 'Distancia', value: 'distance' },
        ]}
        value={type}
        onChange={(val) => setType(val as 'text' | 'number' | 'select' | 'time' | 'multitime')}
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
            <div key={index} className="flex gap-2 items-center" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
       {type === 'multitime' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Text variant="headingSm" as="h3">Componentes de Tiempo</Text>
            
            {timeComponents.length > 0 ? (
              <>
                {timeComponents.map((component, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <TextField
                        label="Etiqueta del componente"
                        value={component.label}
                        onChange={(value) => {
                          const updated = [...timeComponents];
                          updated[index] = { ...updated[index], label: value };
                          setTimeComponents(updated);
                        }}
                        autoComplete="off"
                      />
                    </div>
                    <Button
                      icon={MinusCircleIcon}
                      onClick={() => {
                        setTimeComponents(prev => prev.filter((_, i) => i !== index));
                      }}
                      tone="critical"
                    />
                  </div>
                ))}
              </>
            ) : (
              <Text variant="bodyMd" tone="subdued" as="p">
                No hay componentes de tiempo definidos
              </Text>
            )}
            
            <div style={{ textAlign: 'right' }}>
              <Button
                onClick={() => {
                  const newKey = `component_${timeComponents.length + 1}`;
                  setTimeComponents([...timeComponents, {
                    label: `Componente ${timeComponents.length + 1}`,
                    key: newKey
                  }]);
                }}
              >
                Agregar componente
              </Button>
            </div>
          </div>
        </Card>
      )}
    <Checkbox
      label="Pregunta para todos los deportes"
      checked={forAllSports}
      onChange={(checked) => {
        setForAllSports(checked);
        if (checked) {
          // Si selecciona "todos", asignamos todos los deportes
          setSelectedSports(sports.map(sport => ({
            sportId: sport.id,
            order: 0 // Orden inicial
          })));
        }
      }}
    />
    
    {!forAllSports && (
  <Card>
      <Text variant="headingSm" as="h3">Deportes asociados</Text>
      <ChoiceList
        title="Selecciona deportes"
        choices={sports.map(sport => ({
          label: sport.name,
          value: sport.id
        }))}
        selected={selectedSports.map(s => s.sportId)}
        onChange={(selected) => {
          setSelectedSports(selected.map(sportId => ({
            sportId,
            order: 0
          })));
        }}
        allowMultiple
      />
  </Card>
)}

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          {defaultValues ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </div>
  );
}
