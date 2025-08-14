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
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

async function fetchShopifyProductData(productGid: string) {
  // Validación de configuración
  if (!SHOPIFY_STOREFRONT_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    throw new Error('Configuración de Shopify incompleta en variables de entorno');
  }

  // Consulta exacta como la especificaste
   const query = `
    query GetProductInfo($id: ID!) {
      product(id: $id) {
        title
        handle
        featuredImage {
          url
        }
        variants(first: 1) {
          edges {
            node {
            id
              price {
            amount
            currencyCode
          }
            }
          }
        }
        onlineStoreUrl
      }
    }
  `;

  try {
    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/api/2025-07/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { id: productGid }
        })
      }
    );

    const result = await response.json();

    // Manejo de errores detallado
    if (!response.ok || result.errors) {
      console.error('Error en Shopify API Response:', {
        status: response.status,
        statusText: response.statusText,
        errors: result.errors,
        headers: response.headers
      });
      throw new Error(result.errors?.[0]?.message || 'Error en la API de Shopify');
    }

    const product = result.data?.product;
    if (!product) {
      console.warn('Producto no encontrado con ID:', productGid);
      return null;
    }

    // Estructura de respuesta optimizada
    return {
      productName: product.title,
      handle: product.handle,
      imageUrl: product.featuredImage?.url || null,
      variantid: product.variants.edges[0]?.node?.id || null,
      price: product.variants.edges[0]?.node?.price || null,
      productUrl: product.onlineStoreUrl || 
                 `https://${process.env.SHOPIFY_STORE_DOMAIN}/products/${product.handle}`
    };

  } catch (error) {
    console.error('Error en fetchShopifyProductData:', {
      error: error instanceof Error ? error.message : error,
      productGid
    });
    return null;
  }
}
export async function POST(req: Request) {
  try {
    const { answers, sportId } = await req.json();
    console.log('Procesando recomendaciones para deporte:', sportId);
    console.log('Respuestas recibidas:', answers);

    const [rulesSnap, productsSnap, categoriesSnap] = await Promise.all([
      getDocs(collection(db, 'rules')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'categories')),
    ]);

    // Procesar categorías del deporte seleccionado
    const sportCategories = categoriesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Category))
      .filter(cat => cat.sportIds?.includes(sportId));

    console.log(`Categorías para deporte ${sportId}:`, sportCategories.length);

    // Procesar reglas para estas categorías
    const rules: Rule[] = rulesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Rule))
      .filter(rule => sportCategories.some(cat => cat.id === rule.categoryId));

    const products: Product[] = productsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Product));

    const categoriesMap = Object.fromEntries(
      sportCategories.map(cat => [cat.id, cat.name])
    );

    const recommendations = [];

    for (const rule of rules) {
      console.log(`Procesando regla ${rule.id} para categoría ${rule.categoryId}`);

      const { baseQuestionKey, baseMultiplier, modifiers, categoryId, logic, baseQuestionType } = rule;
      let baseValue = 0;
      if (baseQuestionType === 'multitime') {
        const timeComponents = answers[baseQuestionKey];
        if (typeof timeComponents === 'object' && timeComponents !== null) {
          baseValue = Object.values(timeComponents).reduce((sum: number, val: any) => {
            return sum + (parseInt(val) || 0);
          }, 0);
          console.log(`Suma total de componentes multitime: ${baseValue} minutos`);
        }
      } 
      else {
        // Manejo normal para otros tipos de preguntas
        const baseValueStr = answers[baseQuestionKey];
        if (!baseValueStr) continue;
        
        baseValue = parseFloat(baseValueStr);
        if (isNaN(baseValue)) continue;
      }

      // Conversión de unidades
      if (baseQuestionType === 'time' || baseQuestionType === 'multitime') baseValue = baseValue / 60;

      console.log(`Valor base procesado: ${baseValue}`);

      let finalMultiplier = baseMultiplier;
      let shouldApplyRule = true;

      // Lógica de modificadores (versión corregida)
      if (modifiers && modifiers.length > 0) {
        console.log(`Evaluando ${modifiers.length} modificadores...`);
        
        const matchedModifiers = modifiers.filter(mod => {
          const answerValue = answers[mod.key];
          const isMatch = answerValue === mod.value;
          console.log(`Modificador ${mod.key}: esperado=${mod.value}, actual=${answerValue}, coincide=${isMatch}`);
          return isMatch;
        });

        console.log(`Modificadores coincidentes: ${matchedModifiers.length}/${modifiers.length}`);

        if (logic === 'AND' && matchedModifiers.length !== modifiers.length) {
          console.log(`No se cumplen todos los modificadores AND requeridos`);
          shouldApplyRule = false;
        } 
        else if (logic === 'OR' && matchedModifiers.length === 0) {
          console.log(`No se cumple ningún modificador OR`);
          shouldApplyRule = false;
        }
        else {
          matchedModifiers.forEach(mod => {
            console.log(`Aplicando multiplicador ${mod.multiplier} por ${mod.key}=${mod.value}`);
            finalMultiplier *= mod.multiplier;
          });
        }
      }

      if (!shouldApplyRule) continue;

      const totalAmount = baseValue * finalMultiplier;
      console.log(`Total calculado: ${totalAmount}`);

      const categoryProducts = [];
      
      for (const p of products.filter(p => 
           Array.isArray(p.categoryIds) && p.categoryIds.includes(categoryId))
           .sort((a, b) => (b.priority || 0) - (a.priority || 0))) {
        
        const quantity = p.amountPerUnit ? Math.ceil(totalAmount / p.amountPerUnit) : 1;
        const shopifyData = await fetchShopifyProductData(p.shopifyGid);

        categoryProducts.push({
          productId: p.id,
          shopifyGid: p.shopifyGid,
          productName: p.name,
          productUrl: shopifyData?.productUrl,
          imageUrl: shopifyData?.imageUrl || '',
          variantid:shopifyData?.variantid,
          price: shopifyData?.price || null,
          quantityRecommended: quantity
        });
      }

      recommendations.push({
        categoryId,
        categoryName: categoriesMap[categoryId] || 'Categoría desconocida',
        totalAmount,
        products: categoryProducts
      });
    }

    console.log('Recomendaciones generadas:', recommendations.length);
    return new NextResponse(JSON.stringify({ recommendations }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error en generación de recomendaciones:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error generating recommendations' }),
      { status: 500, headers: corsHeaders }
    );
  }
}