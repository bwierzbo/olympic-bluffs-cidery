import { NextRequest, NextResponse } from 'next/server';
import { squareClient } from '@/lib/square';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return new NextResponse('Image ID is required', { status: 400 });
    }

    // Retrieve the image from Square Catalog
    const response = await squareClient.catalog.retrieveObject(imageId);

    if (!response.object || response.object.type !== 'IMAGE') {
      return new NextResponse('Image not found', { status: 404 });
    }

    const imageData = response.object.imageData;

    if (!imageData?.url) {
      return new NextResponse('Image URL not available', { status: 404 });
    }

    // Fetch the actual image from Square's URL
    const imageResponse = await fetch(imageData.url);

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 500 });
    }

    // Get the image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with proper content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error fetching catalog image:', error);
    return new NextResponse('Failed to load image', { status: 500 });
  }
}
