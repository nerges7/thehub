'use client';

import { useEffect, useState } from 'react';
import { Page, Card, Button, Text, Modal, Spinner } from '@shopify/polaris';
import { getCategories, deleteCategory } from './utils';
import { getSports } from '../sports/utils';
import CategoryForm from './CategoryForm';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [sportsMap, setSportsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [cats, sports] = await Promise.all([getCategories(), getSports()]);

    const map: Record<string, string> = {};
    sports.forEach((s: any) => {
      map[s.id] = s.name;
    });

    setCategories(cats);
    setSportsMap(map);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    await loadData();
  };

  return (
    <Page title="Categorías de producto"
          primaryAction={{
        content: 'Crear categoria',
        onAction: () => {
          setSelected(null);
          setOpenModal(true);
        },
      }}>


      <Card>
        {loading ? (
          <Spinner accessibilityLabel="Cargando categorías" size="large" />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex justify-between items-start border-b pb-3"
              >
                <div>
                  <Text variant="bodyMd" as="p">{cat.name}</Text>
                  {cat.description && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      {cat.description}
                    </Text>
                  )}
                  {cat.sportIds?.length > 0 && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      Deportes: {cat.sportIds.map((id: string) => sportsMap[id] || '—').join(', ')}
                    </Text>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="slim" onClick={() => {
                    setSelected(cat);
                    setOpenModal(true);
                  }}>
                    Editar
                  </Button>
                  <Button size="slim" tone="critical" onClick={() => handleDelete(cat.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={selected ? 'Editar categoría' : 'Nueva categoría'}
      >
        <Modal.Section>
          <CategoryForm
            defaultValues={selected}
            onSuccess={() => {
              setOpenModal(false);
              loadData();
            }}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
