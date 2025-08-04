'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Page, Text, Spinner } from '@shopify/polaris';

export default function FirebaseTestPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestData() {
      try {
        const snapshot = await getDocs(collection(db, 'sports'));
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(items);
        console.log('✅ Datos desde Firebase:', items);
      } catch (error) {
        console.error('🔥 Error de conexión con Firebase:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, []);

  return (
    <Page title="Prueba de conexión con Firebase">
      {loading ? (
        <Spinner accessibilityLabel="Cargando datos de Firebase" size="large" />
      ) : data.length === 0 ? (
        <Text variant="bodyMd" as ="p">⚠️ No se encontraron documentos en la colección <b>sports</b>.</Text>
      ) : (
        <ul style={{ marginTop: '1rem' }}>
          {data.map((item) => (
            <li key={item.id}>
              <Text variant="bodyMd" as ="p">{item.name}</Text>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
