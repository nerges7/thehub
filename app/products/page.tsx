'use client';

import { useEffect, useState } from 'react';
import { Page, Card, Button, Text, Modal, Spinner } from '@shopify/polaris';
import { getProducts, deleteProduct } from './utils';
import { getCategories } from '../product-types/utils';
import ProductForm from './ProductForm';
import { Product, Category } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      getProducts() as Promise<Product[]>,
      getCategories() as Promise<Category[]>
    ]);

    const map: Record<string, string> = {};
    cats.forEach((cat) => {
      map[cat.id] = cat.name;
    });

    setCategoriesMap(map);
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    await loadData();
  };

  return (
    <Page title="Productos"
      primaryAction={{
        content: 'Crear producto',
        onAction: () => {
          setSelected(null);
          setOpenModal(true);
        },
      }}
    >
      <Card>
        {loading ? (
          <Spinner accessibilityLabel="Cargando productos" size="large" />
        ) : (
          <div className="flex flex-col gap-3 p-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-start border-b pb-3"
              >
                <div>
                  <Text variant="bodyMd" as="h4">{product.name}</Text>
                  {product.description && (
                    <Text variant="bodySm" tone="subdued" as="p">{product.description}</Text>
                  )}
                  <Text variant="bodySm" tone="subdued" as="p">
                    Categorías:{' '}
                    {product.categoryIds?.map(id => categoriesMap[id]).filter(Boolean).join(', ') || 'Sin categorías'} | Prioridad: {product.priority}
                  </Text>
                </div>
                <div className="flex gap-2">
                  <Button size="slim" onClick={() => {
                    setSelected(product);
                    setOpenModal(true);
                  }}>
                    Editar
                  </Button>
                  <Button size="slim" tone="critical" onClick={() => handleDelete(product.id)}>
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
        title={selected ? 'Editar producto' : 'Nuevo producto'}
      >
        <Modal.Section>
          <ProductForm
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
