import { NextResponse } from 'next/server';
import { predictScrapMaterial } from '@/lib/services/aiScrap';

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType, material, estimatedWeight, condition } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image base64 buffer is required.' }, { status: 400 });
    }

    const prediction = await predictScrapMaterial(
      imageBase64,
      mimeType || 'image/jpeg',
      material,
      estimatedWeight,
      condition
    );

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error in predict-scrap API route:', error);
    return NextResponse.json(
      { error: 'Internal server error processing scrap classification.' },
      { status: 500 }
    );
  }
}
