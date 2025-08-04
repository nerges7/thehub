'use client';

import {
  Page,
  Card,
  Button,
  Modal,
  ResourceList,
  ResourceItem,
  Text,
  Select,
  SkeletonPage,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonTabs,
} from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { getQuestions, updateQuestion } from './utils';
import { getSports } from '../sports/utils';
import { Question, Sport } from '@/types';
import QuestionForm from './QuestionForm';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [questionsData, sportsData] = await Promise.all([getQuestions(), getSports()]);
    setQuestions(questionsData);
    setSports(sportsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredQuestions = questions
    .filter((q) => {
      if (sportFilter === 'all') return true;
      return q.sports?.some((s) => s.sportId === sportFilter);
    })
    .sort((a, b) => {
      const orderA = a.sports?.find((s) => s.sportId === sportFilter)?.order ?? 0;
      const orderB = b.sports?.find((s) => s.sportId === sportFilter)?.order ?? 0;
      return orderA - orderB;
    });

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredQuestions.findIndex((q) => q.id === active.id);
    const newIndex = filteredQuestions.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(filteredQuestions, oldIndex, newIndex);

    const updated = reordered.map((q, idx) => {
      if (!q.sports) return q;
      const updatedSports = q.sports.map((s) =>
        s.sportId === sportFilter ? { ...s, order: idx } : s
      );
      return { ...q, sports: updatedSports };
    });

    setQuestions((prev) =>
      prev.map((q) => updated.find((uq) => uq.id === q.id) || q)
    );

    for (const q of updated) {
      await updateQuestion(q.id!, q);
    }
  };

  if (loading) {
    return (
      <SkeletonPage primaryAction>
        <SkeletonTabs />
        <Card>
          <SkeletonDisplayText size="small" />
          <SkeletonBodyText />
        </Card>
      </SkeletonPage>
    );
  }

  return (
    <Page
      title="Preguntas"
      primaryAction={{
        content: 'Crear pregunta',
        onAction: () => {
          setEditingQuestion(null);
          setShowModal(true);
        },
      }}
    >
      <Card>
        <Select
          label="Filtrar por deporte"
          options={[{ label: 'Todos', value: 'all' }, ...sports.map((s) => ({ label: s.name, value: s.id }))]}
          onChange={setSportFilter}
          value={sportFilter}
        />
      </Card>

      <Card >
        <Text variant="headingMd" as="h4">Listado de preguntas</Text>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={filteredQuestions.map((q) => q.id!)}
            strategy={verticalListSortingStrategy}
          >
            <ResourceList
              resourceName={{ singular: 'pregunta', plural: 'preguntas' }}
              items={filteredQuestions}
              renderItem={(item) => {
                return (
                  <SortableItem key={item.id} id={item.id!}>
                    <ResourceItem
                      id={item.id}
                      accessibilityLabel={`Editar ${item.text}`}
                      onClick={() => {
                        setEditingQuestion(item);
                        setShowModal(true);
                      }}
                    >
                      <Text variant="bodySm" fontWeight="medium" as="h3">
                        {item.text}
                      </Text>
                    </ResourceItem>
                  </SortableItem>
                );
              }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingQuestion ? 'Editar pregunta' : 'Crear pregunta'}
      >
        <Modal.Section>
           <QuestionForm
     defaultValues={editingQuestion || undefined}
     onSuccess={() => {
              setShowModal(false);
              fetchData();
            }}
      onClose={() => setShowModal(false)}
  />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
