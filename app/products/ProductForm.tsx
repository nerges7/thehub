'use client';

import {
  TextField,
  Button,
  Modal,
  Text,
  Select,
  Card,
  ChoiceList,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Pagination,
} from '@shopify/polaris';
import { useCallback, useEffect, useState } from 'react';
import { getCategories } from '../product-types/utils';
import { addProduct, updateProduct } from './utils';
import { Category, Product } from '@/types';

interface Props {
  defaultValues?: Product;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ProductForm({ defaultValues, onSuccess }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryIds, setCategoryIds] = useState<string[]>(defaultValues?.categoryIds || []);
  const [shopifyGid, setShopifyGid] = useState(defaultValues?.shopifyGid || '');
  const [name, setName] = useState(defaultValues?.name || '');
  const [description, setDescription] = useState(defaultValues?.description || '');
  const [priority, setPriority] = useState(String(defaultValues?.priority ?? '1'));
  const [amountPerUnit, setAmountPerUnit] = useState(
    String(defaultValues?.amountPerUnit ?? '1')
  );

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [startCursor, setStartCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const fetchShopifyProducts = useCallback(
    async (
      cursor: string | null = null,
      search = '',
      direction: 'after' | 'before' = 'after'
    ) => {
      setLoadingProducts(true);
      try {
        const url = new URL('/api/shopify/products', window.location.origin);
        if (cursor) url.searchParams.set(direction, cursor);
        if (search) url.searchParams.set('search', search);

        const res = await fetch(url.toString());
        const data = await res.json();

        setShopifyProducts(data.products || []);
        setEndCursor(data.pageInfo?.endCursor || null);
        setStartCursor(data.pageInfo?.startCursor || null);
        setHasNextPage(data.pageInfo?.hasNextPage || false);
        setTotalProducts(data.totalCount || data.products.length || 0);
      } catch (err) {
        console.error('Error cargando productos de Shopify:', err);
      } finally {
        setLoadingProducts(false);
      }
    },
    []
  );

  useEffect(() => {
    loadCategories();
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchShopifyProducts(null, searchTerm);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm, fetchShopifyProducts]);

  const handleSubmit = async () => {
    const payload = {
      categoryIds,
      shopifyGid,
      name,
      description,
      priority: parseInt(priority),
      amountPerUnit: parseFloat(amountPerUnit),
    };

    if (defaultValues?.id) {
      await updateProduct(defaultValues.id, payload);
    } else {
      await addProduct(payload);
    }

    onSuccess();
  };

  return (
    <div className="space-y-4">
  <ChoiceList
  title="Categorías"
  allowMultiple
  choices={categories.map((c) => ({
    label: c.name,
    value: c.id,
  }))}
  selected={categoryIds}
  onChange={setCategoryIds}
/>


      <TextField
        label="Nombre del producto"
        value={name}
        onChange={setName}
        autoComplete="off"
        disabled
      />

      <Button
        onClick={async () => {
          await fetchShopifyProducts();
          setModalOpen(true);
        }}
      >
        Seleccionar producto de Shopify
      </Button>

      <TextField
        label="Descripción"
        value={description}
        onChange={setDescription}
        multiline
        autoComplete="off"
      />

      <TextField
        label="Prioridad"
        type="number"
        value={priority}
        onChange={setPriority}
        autoComplete="off"
      />

      <TextField
        label="Cantidad por unidad"
        type="number"
        value={amountPerUnit}
        onChange={setAmountPerUnit}
        autoComplete="off"
      />

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          {defaultValues ? 'Actualizar' : 'Crear'}
        </Button>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Seleccionar producto"
      >
        <Modal.Section>
          <TextField
            label="Buscar"
            value={searchTerm}
            onChange={setSearchTerm}
            autoComplete="off"
          />

          <Text variant="bodySm" tone="subdued" as="p" >
            {totalProducts} producto(s) encontrados
          </Text>

          <div className="mt-4">
            {loadingProducts ? (
              <Text as="p" tone="subdued" variant="bodySm">
                Cargando productos...
              </Text>
            ) : (
              <ResourceList
                resourceName={{ singular: 'producto', plural: 'productos' }}
                items={shopifyProducts}
                renderItem={(item: any) => {
                  const { id, title, image } = item;
                  const media = (
                    <Thumbnail
                      source={image || 'https://cdn.shopify.com/s/files/1/0000/0001/products/default.png'}
                      alt={title}
                    />
                  );

                  return (
                    <ResourceItem
                      id={id}
                      media={media}
                      accessibilityLabel={`Seleccionar ${title}`}
                      onClick={() => {
                        setShopifyGid(id);
                        setName(title);
                        setModalOpen(false);
                      }}
                    >
                      <Text as="h3" variant="bodySm" fontWeight="medium">
                        {title}
                      </Text>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </div>

          <div className="mt-4">
            <Pagination
              hasNext={hasNextPage}
              hasPrevious={!!startCursor}
              onNext={() => {
                if (hasNextPage) fetchShopifyProducts(endCursor, searchTerm, 'after');
              }}
              onPrevious={() => {
                if (startCursor) fetchShopifyProducts(startCursor, searchTerm, 'before');
              }}
            />
          </div>
        </Modal.Section>
      </Modal>
    </div>
  );
}
