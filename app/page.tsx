'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Page, Text, Spinner } from '@shopify/polaris';

export default function AdminHome() {
  const [sports, setSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSports() {
      try {
        const snapshot = await getDocs(collection(db, 'sports'));
        const names = snapshot.docs.map(doc => doc.data().name);
        setSports(names);
        console.log('Docs:', snapshot.docs.map(d => d.data()));
      } catch (err) {
        console.error('❌ Error al conectar con Firebase:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSports();
  }, []);

  return (
    <Page title="Panel de administración">
      <Text variant="headingLg" as="h1">
        Deportes cargados {loading && <Spinner accessibilityLabel="Cargando..." size="small" />}
      </Text>

      {!loading && (
        <ul style={{ marginTop: '1rem' }}>
          {sports.length === 0 ? (
            <Text as="h2" variant="headingMd">⚠️ No hay deportes cargados en Firebase.</Text>
          ) : (
            sports.map((sport, idx) => <li key={idx}><Text as="p" variant="headingMd">{sport}</Text></li>)
          )}
        </ul>
      )}
    </Page>
  );
}
