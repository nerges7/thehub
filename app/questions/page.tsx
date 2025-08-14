'use client';

import {Page,Card,ResourceList,Button,Select,Modal,Text,} from '@shopify/polaris';
import { PlusIcon } from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import { getSports } from '../sports/utils';
import { getQuestions, deleteQuestion, updateQuestion } from './utils';
import { Question, Sport } from '@/types';
import QuestionForm from './QuestionForm';
import { stripHtml } from '@/utils/stripHtml';
// dnd-kit
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState<Question | null>(null);

  const loadData = async () => {
    const [qs, ss] = await Promise.all([getQuestions(), getSports()]);
    setQuestions(qs);
    setSports(ss);
  };

  useEffect(() => {
    loadData();
  }, []);

const filteredQuestions = sportFilter === 'all' 
    ? questions 
    : questions.filter(q => q.sports?.some(s => s.sportId === sportFilter) || q.forAllSports);

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (sportFilter === 'all') return 0;
    
    const aOrder = a.sports?.find(s => s.sportId === sportFilter)?.order || 0;
    const bOrder = b.sports?.find(s => s.sportId === sportFilter)?.order || 0;
    return aOrder - bOrder;
  });

  const sportOptions = [
    { label: 'Todos los deportes', value: 'all' },
    ...sports.map((s) => ({ label: s.name, value: s.id })),
  ];

const handleReorder = async (newOrder: Question[]) => {
  if (sportFilter === 'all') return;

  // 1. Actualizar el estado local primero para respuesta inmediata
  setQuestions(prevQuestions => {
    return prevQuestions.map(question => {
      // Encontrar la nueva posición de esta pregunta en el orden arrastrado
      const newIndex = newOrder.findIndex(q => q.id === question.id);
      if (newIndex === -1) return question;

      // Actualizar solo el order para el deporte filtrado
      const updatedSports = question.sports?.map(sport => 
        sport.sportId === sportFilter 
          ? { ...sport, order: newIndex } 
          : sport
      ) ?? [{ sportId: sportFilter, order: newIndex }]; // Si no existía, lo agregamos

      return {
        ...question,
        sports: updatedSports
      };
    });
  });

  // 2. Actualizar en Firebase solo los orders modificados
  try {
    const updates = newOrder.map((q, newIndex) => {
      const questionToUpdate = questions.find(question => question.id === q.id);
      if (!questionToUpdate) return Promise.resolve();

      const existingSportEntry = questionToUpdate.sports?.find(s => s.sportId === sportFilter);
      const currentOrder = existingSportEntry?.order ?? -1;

      // Solo actualizar si el orden cambió
      if (currentOrder !== newIndex) {
        const updatedSports = questionToUpdate.sports?.map(sport => 
          sport.sportId === sportFilter 
            ? { ...sport, order: newIndex } 
            : sport
        ) ?? [{ sportId: sportFilter, order: newIndex }];

        return updateQuestion(q.id, {
          sports: updatedSports
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);
  } catch (error) {
    console.error("Error updating questions order:", error);
    // Revertir cambios en caso de error
    loadData();
  }
};

// Función para obtener preguntas ordenadas por el deporte seleccionado
const getSortedQuestions = () => {
  if (sportFilter === 'all') {
    return [...questions].sort((a, b) => 
      stripHtml(a.text).localeCompare(stripHtml(b.text))
    );
  }

  return [...questions]
    .filter(q => q.forAllSports || q.sports?.some(s => s.sportId === sportFilter))
    .sort((a, b) => {
      // Para preguntas "para todos los deportes", usar orden alto para que aparezcan primero
      if (a.forAllSports && !b.forAllSports) return -1;
      if (!a.forAllSports && b.forAllSports) return 1;
      
      // Ordenar por el order específico para este deporte
      const aOrder = a.sports?.find(s => s.sportId === sportFilter)?.order ?? Infinity;
      const bOrder = b.sports?.find(s => s.sportId === sportFilter)?.order ?? Infinity;
      
      return aOrder - bOrder;
    });
};

const getSportNames = (question: Question) => {
  if (question.forAllSports) return 'Todos';
  if (!question.sports?.length) return '—';
  
  return question.sports
    .map((s) => sports.find((sp) => sp.id === s.sportId)?.name)
    .filter(Boolean)
    .join(', ');
};

  const sensors = useSensors(useSensor(PointerSensor));

  const SortableItem = ({
    question,
    onClick,
    onDelete,
  }: {
    question: Question;
    onClick: () => void;
    onDelete: () => void;
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: question.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <ResourceList.Item id={question.id} onClick={onClick}>
          <div>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {stripHtml(question.text)}
            </Text>
         <Text variant="bodySm" tone="subdued" as="p">
  Tipo: {question.type === 'number' ? 'Numérica' : 'Selección'}
  {question.unit ? ` (${question.unit})` : ''} | Deportes: {getSportNames(question)}
</Text>
            <div className="mt-2">
              <Button size="slim" onClick={onDelete} tone='critical'>
                Eliminar
              </Button>
            </div>
          </div>
        </ResourceList.Item>
      </div>
    );
  };

  return (
    <Page
      title="Preguntas"
      primaryAction={{
        content: 'Agregar pregunta',
        icon: PlusIcon,
        onAction: () => {
          setSelected(null);
          setOpenModal(true);
        },
      }}
    >
      <Card>
        <div className="p-4">
          <Select
            label="Filtrar por deporte"
            options={sportOptions}
            value={sportFilter}
            onChange={setSportFilter}
          />
        </div>

        {sportFilter === 'all' ? (
          <ResourceList
            resourceName={{ singular: 'pregunta', plural: 'preguntas' }}
            items={sortedQuestions}
            renderItem={(q) => (
              <ResourceList.Item
                id={q.id}
                onClick={() => {
                  setSelected(q);
                  setOpenModal(true);
                }}
              >
                <div>
                  <Text variant="bodyMd" fontWeight="bold" as="h3">{stripHtml(q.text)}</Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Tipo: {q.type === 'number' ? 'Numérica' : 'Selección'}
                    {q.unit ? ` (${q.unit})` : ''} | Deporte: {getSportNames(q)}
                  </Text>
                  <div className="mt-2">
                    <Button
                      size="slim"
                      tone='critical'
                       onClick={() => {
    deleteQuestion(q.id).then(loadData);
  }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </ResourceList.Item>
            )}
          />
        ) : (
        <DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={({ active, over }) => {
    if (!over || active.id === over.id || sportFilter === 'all') return;
    
    const oldIndex = sortedQuestions.findIndex(q => q.id === active.id);
    const newIndex = sortedQuestions.findIndex(q => q.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(sortedQuestions, oldIndex, newIndex);
      handleReorder(newOrder);
    }
  }}
>
            <SortableContext
              items={sortedQuestions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedQuestions.map((q) => (
                <SortableItem
                  key={q.id}
                  question={q}
                  onClick={() => {
                    setSelected(q);
                    setOpenModal(true);
                  }}
                  onDelete={() => {
                    deleteQuestion(q.id).then(loadData);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={selected ? 'Editar pregunta' : 'Nueva pregunta'}
 
      >
        <Modal.Section>
          <QuestionForm
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