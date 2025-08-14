'use client';

import { useEffect, useState } from 'react';
import { Page, Card, Button, Text } from '@shopify/polaris';
import { getRules, deleteRule } from './utils';
import { getCategories } from '../product-types/utils';
import { getQuestions } from '../questions/utils';
import { Category, Question, Rule } from '@/types';
import RuleForm from './RuleForm';
import { Modal } from '@shopify/polaris';
import { stripHtml } from '@/utils/stripHtml';
export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Rule | null>(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    loadData();
    getQuestions().then(setQuestions);
  }, []);

  const loadData = async () => {
    const [rs, cs, qs] = await Promise.all([
      getRules(),
      getCategories(),
      getQuestions(),
    ]);
    setRules(rs);
    setCategories(cs);
    setQuestions(qs);
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || '—';
  const getBaseQuestionInfo = (key: string) => {
  const q = questions.find((q) => q.key === key);
  return q ? `${q.text}${q.unit ? ` (${q.unit})` : ''}` : '—';
};

  const getQuestionText = (key: string) =>
    questions.find((q) => q.key === key)?.text || key;

  return (
    <Page
      title="Reglas de cálculo"
      primaryAction={{
        content: 'Crear regla',
        onAction: () => {
          setSelected(null);
          setOpenModal(true);
        },
      }}
    >
      <Card>
        {rules.length === 0 ? (
          <Text tone="subdued" as="p">No hay reglas aún.</Text>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="border-b py-3 flex justify-between items-center"
            >
              <div>
                <Text variant="bodyMd" fontWeight="medium" as="p">
                  {getCategoryName(rule.categoryId)}
                </Text>

               <Text variant="bodySm" tone="subdued" as="p">
  Unidad base: {stripHtml(getBaseQuestionInfo(rule.baseQuestionKey))} × {rule.baseMultiplier}
</Text>


                {rule.modifiers.length > 0 && (
                  <>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Operador lógico: <strong>{rule.logic}</strong>
                    </Text>
                    <Text variant="bodySm" as="p">
                      Condiciones:
                      {rule.modifiers.map((mod, i) => (
                        <span key={i}>
                          {' '}
                          {stripHtml(getQuestionText(mod.key))} = {mod.value} × {mod.multiplier}
                          {i < rule.modifiers.length - 1 ? ` ${rule.logic} ` : ''}
                        </span>
                      ))}
                    </Text>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelected(rule);
                    setOpenModal(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  onClick={async () => {
                    if (confirm('¿Eliminar esta regla?')) {
                      await deleteRule(rule.id);
                      loadData();
                    }
                  }}
                  tone="critical"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={selected ? 'Editar regla' : 'Crear regla'}
      >
        <Modal.Section>
          <RuleForm
            defaultValues={selected || undefined}
            onSuccess={() => {
              setOpenModal(false);
              loadData();
            }}
            onClose={() => setOpenModal(false)}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}