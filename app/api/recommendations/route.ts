import { db } from '@/lib/firebase';
import { getDocs, collection } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import { Rule, Product, Category } from '@/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const answers: Record<string, string> = body.answers;

    console.log('📨 Respuestas del usuario:', answers);

    const [rulesSnap, productsSnap, categoriesSnap] = await Promise.all([
      getDocs(collection(db, 'rules')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]);

    const rules: Rule[] = rulesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rule[];

    const products: Product[] = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    const categoriesMap: Record<string, string> = Object.fromEntries(
      categoriesSnap.docs.map((doc) => [doc.id, (doc.data() as Category).name])
    );

    const recommendations = [];

    for (const rule of rules) {
      const { baseQuestionKey, baseMultiplier, modifiers, categoryId, logic, baseQuestionType } = rule;

      const baseValueStr = answers[baseQuestionKey];
      let baseValue: number;

      baseValue = parseFloat(baseValueStr);
      if (baseQuestionType === 'time') {
  baseValue = baseValue / 60;
}
if (isNaN(baseValue)) {
  console.warn(`⚠️ Valor base no numérico para la regla ${rule.id}`);
  continue;
}


      console.log(`🧮 Procesando regla para categoría ${categoryId}`);
      console.log(`→ baseQuestionKey: ${baseQuestionKey}, baseValue: ${baseValueStr}`);

      let finalMultiplier = baseMultiplier;
      let shouldApplyRule = true;

      if (modifiers && modifiers.length > 0) {
        const matched = modifiers.filter((mod) => answers[mod.key] === mod.value);
        const shouldApplyModifiers =
          logic === 'AND'
            ? matched.length === modifiers.length
            : matched.length > 0;

        console.log(`🔗 Modificadores coincidentes:`, matched);

        if (!shouldApplyModifiers) {
          console.log(`🚫 Regla ignorada porque no coinciden los modificadores.`);
          shouldApplyRule = false;
        } else {
          for (const mod of matched) {
            finalMultiplier *= mod.multiplier;
          }
        }
      }

      if (!shouldApplyRule) continue;

      const totalAmount = baseValue * finalMultiplier;
      console.log(`💡 totalAmount calculado: ${totalAmount}`);

      const categoryProducts = products.filter((p) =>
        Array.isArray(p.categoryIds) && p.categoryIds.includes(categoryId)
      );
      console.log(`🧴 Productos encontrados para la categoría:`, categoryProducts);

      const productRecommendations = categoryProducts.map((p) => {
        const units = p.amountPerUnit
          ? Math.ceil(totalAmount / p.amountPerUnit)
          : '?';
        return {
          productId: p.id,
          productName: p.name,
          totalAmount,
          amountPerUnit: p.amountPerUnit,
          quantityRecommended: units,
        };
      });

      recommendations.push({
        categoryId,
        categoryName: categoriesMap[categoryId] || 'Categoría desconocida',
        totalAmount,
        products: productRecommendations,
      });
    }

    console.log('✅ Recomendaciones generadas:', recommendations);

    return new NextResponse(JSON.stringify({ recommendations }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error('❌ Error en la generación de recomendaciones:', e);
    return new NextResponse(JSON.stringify({ error: 'Error generating recommendations' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
