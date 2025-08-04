import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const COLLECTION = 'categories';
import { Category } from '@/types';
export const getCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(collection(db, 'categories'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];
};


export const addCategory = async (data: { name: string; description?: string; sportIds: string[] }) => {
  return await addDoc(collection(db, COLLECTION), data);
};

export const updateCategory = async (id: string, data: { name: string; description?: string; sportIds: string[] }) => {
  const ref = doc(db, COLLECTION, id);
  return await updateDoc(ref, data);
};

export const deleteCategory = async (id: string) => {
  const ref = doc(db, COLLECTION, id);
  return await deleteDoc(ref);
};
