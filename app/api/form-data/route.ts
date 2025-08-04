import { db } from '@/lib/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { NextResponse } from 'next/server';

// 🔁 CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O restringe a tu dominio específico
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const sportsSnap = await getDocs(collection(db, 'sports'));
    const questionsSnap = await getDocs(
      query(collection(db, 'questions'), orderBy('order'))
    );

    const sportsRaw = sportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const questions = questionsSnap.docs.map(doc => {
      const data = doc.data() as { sportId: string; [key: string]: any };
      return { id: doc.id, ...data };
    });

    const sportIdsWithQuestions = [...new Set(questions.map(q => q.sportId))];
    const sports = sportsRaw.filter(sport => sportIdsWithQuestions.includes(sport.id));

    return new NextResponse(JSON.stringify({ sports, questions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading form data:', error);
    return new NextResponse(JSON.stringify({ error: 'Error loading form data' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
