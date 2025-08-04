import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Product } from '@/types';

const COLLECTION_NAME = 'products';

export async function getProducts(): Promise<Product[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();

    return {
      id: docSnap.id,
      shopifyGid: data.shopifyGid,
      name: data.name,
      description: data.description || '',
      categoryIds: data.categoryIds || [],
      priority: data.priority ?? 1,
      amountPerUnit: data.amountPerUnit ?? 1,
      sportIds: data.sportIds || [],
    };
  });
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTION_NAME), product);
}

export async function updateProduct(id: string, product: Omit<Product, 'id'>): Promise<void> {
  await updateDoc(doc(db, COLLECTION_NAME, id), product);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
