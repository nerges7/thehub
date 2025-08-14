import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
} from 'firebase/firestore';
import { Question } from '@/types';

const COLLECTION_NAME = 'questions';

export const getQuestions = async (): Promise<Question[]> => {
  const snapshot = await getDocs(collection(db, 'questions'));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Question[];
};

export const addQuestion = async (data: Omit<Question, 'id'>) => {
  await addDoc(collection(db, COLLECTION_NAME), data);
};

export const updateQuestion = async (
  id: string, 
  updates: Partial<Omit<Question, "id">>
) => {
  await updateDoc(doc(db, "questions", id), updates);
};

export const deleteQuestion = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
export async function reorderQuestions(sportId: string, orderedQuestions: Question[]) {
  const updates = orderedQuestions.map(async (question, index) => {
    const newOrder = index;

    const updatedSports = (question.sports || []).map((entry) =>
      entry.sportId === sportId ? { ...entry, order: newOrder } : entry
    );

    await updateDoc(doc(db, 'questions', question.id), {
      sports: updatedSports,
    });
  });

  await Promise.all(updates);
}
