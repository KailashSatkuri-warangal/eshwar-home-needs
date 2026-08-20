import { NextResponse } from 'next/server';
import { parseNaturalLanguageSearch } from '@/lib/services/aiSearch';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Search query string is required.' }, { status: 400 });
    }

    const filters = await parseNaturalLanguageSearch(query);

    return NextResponse.json(filters);
  } catch (error) {
    console.error('Error in AI Search API route:', error);
    return NextResponse.json(
      { error: 'Internal server error parsing search query.' },
      { status: 500 }
    );
  }
}
