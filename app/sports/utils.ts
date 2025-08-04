import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Sport } from '@/types';
const COLLECTION = 'sports';

export const getSports = async (): Promise<Sport[]> => {
  const snapshot = await getDocs(collection(db, 'sports'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Sport[];
};

export const addSport = async (data: { name: string; description?: string }) => {
  return await addDoc(collection(db, COLLECTION), data);
};

export const updateSport = async (id: string, data: { name: string; description?: string }) => {
  const ref = doc(db, COLLECTION, id);
  return await updateDoc(ref, data);
};

export const deleteSport = async (id: string) => {
  const ref = doc(db, COLLECTION, id);
  return await deleteDoc(ref);
};
