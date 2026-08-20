import { NextResponse } from 'next/server';
import { importImageFromDrive } from '@/lib/services/googleDrive';

export async function POST(request: Request) {
  try {
    const { fileId, productId } = await request.json();

    if (!fileId || !productId) {
      return NextResponse.json(
        { error: 'Both fileId and productId are required.' },
        { status: 400 }
      );
    }

    const result = await importImageFromDrive(fileId, productId);

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      size: result.size,
    });
  } catch (error) {
    console.error('Error in Google Drive import API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
