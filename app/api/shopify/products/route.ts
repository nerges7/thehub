import { NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN!;

const GRAPHQL_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/graphql.json`;

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const after = searchParams.get('after');
  const before = searchParams.get('before');
  const queryText = searchParams.get('search') || '';

  const graphqlQuery = {
    query: `
      query GetProducts($first: Int, $last: Int, $after: String, $before: String, $query: String) {
        products(first: $first, last: $last, after: $after, before: $before, query: $query) {
          edges {
            node {
              id
              title
              images(first: 1) {
                edges {
                  node {
                    originalSrc
                    altText
                  }
                }
              }
              createdAt
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `,
    variables: {
      first: !before ? 10 : undefined,
      last: before ? 10 : undefined,
      after: after || undefined,
      before: before || undefined,
      query: queryText ? `title:*${queryText}*` : undefined,
    },
  };

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_TOKEN,
      },
      body: JSON.stringify(graphqlQuery),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify error response:', errorText);
      return NextResponse.json({ error: 'Shopify API error' }, { status: 500 });
    }

    const { data } = await response.json();

    const products = data.products.edges.map((edge: any) => {
      const imageNode = edge.node.images.edges[0]?.node;
      return {
        id: edge.node.id,
        title: edge.node.title,
        image: imageNode?.originalSrc || '',
        altText: imageNode?.altText || '',
        cursor: edge.cursor,
      };
    });

    return NextResponse.json(
      {
        products,
        pageInfo: data.products.pageInfo,
        totalCount: products.length, // ⚠️ si quieres exacto, hay que hacer otro query separado
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('Error fetching Shopify products:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: err.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
