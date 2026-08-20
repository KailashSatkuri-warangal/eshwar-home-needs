import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_SCRAP_RATES, MOCK_REVIEWS 
} from '@/lib/mockData';

const DB_FILE = path.join(process.cwd(), 'data-local.json');

// Initialize database with starter mock data if it doesn't exist
const initDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const initialData = {
      products: MOCK_PRODUCTS,
      categories: MOCK_CATEGORIES,
      scrapRates: MOCK_SCRAP_RATES,
      reviews: MOCK_REVIEWS,
      orders: [],
      quotes: [],
      scrapRequests: [],
      users: [
        {
          uid: 'admin_demo_account',
          email: 'admin@eshwarhomeneeds.com',
          role: 'admin',
          displayName: 'ESHwar Administrator',
          phone: '+91 99494 08061',
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('[Local DB] Initialized data-local.json successfully.');
  }
};

const readDb = () => {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[Local DB] Error reading file:', err);
    return {};
  }
};

const writeDb = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Local DB] Error writing file:', err);
  }
};

// GET /api/db?collection=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');

    if (!collection) {
      return NextResponse.json({ error: 'Collection query parameter is required.' }, { status: 400 });
    }

    const dbData = readDb();
    const dataList = dbData[collection] || [];
    return NextResponse.json(dataList);
  } catch (error) {
    console.error('[Local DB API GET] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/db?collection=xxx
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const { id, data } = await request.json();

    if (!collection || !id || !data) {
      return NextResponse.json({ error: 'Collection, id, and data are required.' }, { status: 400 });
    }

    const dbData = readDb();
    if (!dbData[collection]) {
      dbData[collection] = [];
    }

    // Insert or update
    const index = dbData[collection].findIndex((item: any) => item.id === id);
    if (index > -1) {
      dbData[collection][index] = { ...dbData[collection][index], ...data };
    } else {
      dbData[collection].push({ id, ...data });
    }

    writeDb(dbData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Local DB API POST] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/db?collection=xxx&id=yyy
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!collection || !id) {
      return NextResponse.json({ error: 'Collection and id are required.' }, { status: 400 });
    }

    const dbData = readDb();
    if (dbData[collection]) {
      dbData[collection] = dbData[collection].filter((item: any) => item.id !== id);
      writeDb(dbData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Local DB API DELETE] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
