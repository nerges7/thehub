import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { Rule } from '@/types';

const COLLECTION_NAME = 'rules';

export async function getRules(): Promise<Rule[]> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Rule[];
}

export async function addRule(rule: Omit<Rule, 'id'>) {
  await addDoc(collection(db, COLLECTION_NAME), rule);
}

export async function updateRule(id: string, rule: Omit<Rule, 'id'>) {
  await updateDoc(doc(db, COLLECTION_NAME, id), rule);
}

export async function deleteRule(id: string) {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
}
