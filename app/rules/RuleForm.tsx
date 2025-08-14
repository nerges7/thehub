'use client';

import { useEffect, useState, useMemo } from 'react';
import { Select, TextField, Button, Banner } from '@shopify/polaris';
import { getCategories } from '../product-types/utils';
import { getQuestions } from '../questions/utils';
import { getProducts } from '../products/utils';
import { addRule, updateRule } from './utils';
import { Category, Question, Rule, Product } from '@/types';
import { stripHtml } from '@/utils/stripHtml';

interface Props {
  defaultValues?: Rule;
  onSuccess: () => void;
  onClose: () => void;
}

export default function RuleForm({ defaultValues, onSuccess, onClose }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [baseQuestionType, setBaseQuestionType] = useState<'number' | 'time' | 'distance' | 'multitime'>(
  defaultValues?.baseQuestionType || 'number'
);

  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId || '');
  const [baseQuestionKey, setBaseQuestionKey] = useState(defaultValues?.baseQuestionKey || '');
  const [baseMultiplier, setBaseMultiplier] = useState(
    defaultValues?.baseMultiplier?.toString() || '1',
  );
  const [modifiers, setModifiers] = useState<Rule['modifiers']>(
    defaultValues?.modifiers || [],
  );
  const [logic, setLogic] = useState<'AND' | 'OR'>(defaultValues?.logic || 'AND');

  useEffect(() => {
    getCategories().then(setCategories);
    getQuestions().then(setQuestions);
    getProducts().then((res) => {
      setProducts(res);
      setLoadingProducts(false);
    });
  }, []);

const categoryHasProducts = useMemo(() => {
  if (!categoryId || loadingProducts) return true;
  return products.some((p) => p.categoryIds.includes(categoryId));
}, [categoryId, products, loadingProducts]);


  const handleAddModifier = () => {
    setModifiers([...modifiers, { key: '', value: '', multiplier: 1 }]);
  };

  const handleSubmit = async () => {
const payload: Omit<Rule, 'id'> = {
  categoryId,
  baseQuestionKey,
  baseQuestionType,
  baseMultiplier: parseFloat(baseMultiplier),
  logic,
  modifiers,
};


    if (defaultValues?.id) {
      await updateRule(defaultValues.id, payload);
    } else {
      await addRule(payload);
    }

    onSuccess();
  };

  const numericQuestions = questions.filter((q) => q.type === 'number' || q.type === 'time' || q.type === 'multitime');

  return (
    <div className="space-y-4">
      <Select
        label="Categoría de producto"
        options={[
          { label: 'Elegir categoría...', value: '' },
          ...categories.map((cat) => ({
            label: cat.name,
            value: cat.id,
          })),
        ]}
        value={categoryId}
        onChange={setCategoryId}
      />

      {categoryId && !loadingProducts && !categoryHasProducts && (
        <div className="mt-2">
          <Banner title="Esta categoría no tiene productos asignados" tone="warning">
            <p>
              Los cálculos de esta regla no funcionarán hasta que asocies productos a esta categoría.
            </p>
          </Banner>
        </div>
      )}

<Select
  label="Pregunta base (unidad de cálculo)"
  options={[
    { label: 'Elige una pregunta', value: '' },
    ...numericQuestions.map((q) => ({
      label: `${stripHtml(q.text)}${q.unit ? ` (${q.unit})` : ''}`,
      value: q.key,
    })),
  ]}
  value={baseQuestionKey}
  onChange={(key) => {
    setBaseQuestionKey(key);
    const selected = questions.find((q) => q.key === key);
    if (selected?.type === 'time' || selected?.type === 'number' || selected?.type === 'multitime') {
      setBaseQuestionType(selected.type);
    }
  }}
/>




      <TextField
        label="Cantidad por unidad (multiplicador base)"
        type="number"
        value={baseMultiplier}
        onChange={setBaseMultiplier}
        autoComplete="off"
      />

      <Select
        label="Operador lógico entre condiciones"
        options={[
          { label: 'Todas deben cumplirse (AND)', value: 'AND' },
          { label: 'Alguna puede cumplirse (OR)', value: 'OR' },
        ]}
        value={logic}
        onChange={(val) => setLogic(val as 'AND' | 'OR')}
      />

      <div className="mt-4">
        <strong>Condiciones adicionales</strong>
        <div className="space-y-4 mt-2">
          {modifiers.map((condition, index) => {
            const availableQuestions = questions.filter((q) => q.key !== baseQuestionKey);
            const selectedQuestion = availableQuestions.find((q) => q.key === condition.key);
            const isSelect = selectedQuestion?.type === 'select';
            const availableOptions = selectedQuestion?.options || [];

            return (
              <div key={index} className="border border-gray-200 p-4 rounded">
     <Select
  label="Pregunta condicional"
  options={[
    { label: 'Elige una pregunta', value: '' }, // ✅ opción por defecto
    ...availableQuestions.map((q) => ({
      label: stripHtml(q.text),
      value: q.key,
    })),
  ]}
  value={condition.key}
  onChange={(val) => {
    const updated = [...modifiers];
    updated[index].key = val;
    updated[index].value = ''; // reset respuesta esperada
    setModifiers(updated);
  }}
/>


                {isSelect ? (
                  <Select
                    label="Respuesta esperada"
                    options={[
    { label: 'Elige una respuesta', value: '' },
    ...availableOptions.map((opt) => ({
                      label: opt,
                      value: opt,
                    })),
  ]}
                    value={condition.value}
                    onChange={(val) => {
                      const updated = [...modifiers];
                      updated[index].value = val;
                      setModifiers(updated);
                    }}
                  />
                ) : (
                  <TextField
                    label="Respuesta esperada"
                    value={condition.value}
                    onChange={(val) => {
                      const updated = [...modifiers];
                      updated[index].value = val;
                      setModifiers(updated);
                    }}
                    autoComplete="off"
                  />
                )}

                <TextField
                  label="Multiplicador (ej. 1.2)"
                  type="number"
                  value={condition.multiplier.toString()}
                  onChange={(val) => {
                    const updated = [...modifiers];
                    updated[index].multiplier = parseFloat(val) || 0;
                    setModifiers(updated);
                  }}
                  autoComplete="off"
                />

                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => {
                      const updated = modifiers.filter((_, i) => i !== index);
                      setModifiers(updated);
                    }}
                    tone="critical"
                  >
                    Eliminar condición
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Button onClick={handleAddModifier}>+ Añadir condición</Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} disabled={!categoryId}>
          {defaultValues ? 'Actualizar regla' : 'Crear regla'}
        </Button>
      </div>
    </div>
  );
}
