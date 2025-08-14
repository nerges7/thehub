import { db } from '@/lib/firebase';
import { getDocs, collection } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Sport, Question } from '@/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
    const [sportsSnap, questionsSnap] = await Promise.all([
      getDocs(collection(db, 'sports')),
      getDocs(collection(db, 'questions')),
    ]);

    // Solución óptima con type assertion
    const sports = sportsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Sport));

    const questions = questionsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sports: data.sports || (data.sportId ? [{ sportId: data.sportId, order: data.order || 0 }] : []),
        text: data.text,
        key: data.key,
        type: data.type,
        options: data.options,
        unit: data.unit,
        timeComponents: data.timeComponents || [],
        forAllSports: data.forAllSports || false
      } as Question;
    });

    const sportsWithQuestions = sports.filter(sport => 
      questions.some(q => q.forAllSports || q.sports?.some(s => s.sportId === sport.id))
    );

    return new NextResponse(JSON.stringify({ 
      sports: sportsWithQuestions, 
      questions 
    }), {
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