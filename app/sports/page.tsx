'use client';

import { useEffect, useState } from 'react';
import { Page, Card, Button, Text, Modal, Spinner } from '@shopify/polaris';
import { getSports, deleteSport } from './utils';
import SportForm from './SportForm';

export default function SportsPage() {
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const loadSports = async () => {
    setLoading(true);
    const data = await getSports();
    setSports(data); 
    setLoading(false);
  };

  useEffect(() => {
    loadSports();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteSport(id);
    await loadSports();
  };

  return (
    <Page title="Deportes"
          primaryAction={{
        content: 'Crear Deporte',
        onAction: () => {
          setSelected(null);
          setOpenModal(true);
        },
      }}>

      <Card>
        {loading ? (
          <Spinner accessibilityLabel="Cargando deportes" size="large" />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {sports.map((sport) => (
              <div
                key={sport.id}
                className="flex justify-between items-start border-b pb-3"
              >
                <div>
                  <Text variant="bodyMd" as="p">{sport.name}</Text>
                  {sport.description && (
                    <Text variant="bodySm" tone="subdued" as="p">
                      {sport.description}
                    </Text>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="slim" onClick={() => {
                    setSelected(sport);
                    setOpenModal(true);
                  }}>
                    Editar
                  </Button>
                  <Button size="slim" tone="critical" onClick={() => handleDelete(sport.id)}>
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
        title={selected ? 'Editar deporte' : 'Nuevo deporte'}
      >
        <Modal.Section>
          <SportForm
            defaultValues={selected}
            onSuccess={() => {
              setOpenModal(false);
              loadSports();
            }}
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}
