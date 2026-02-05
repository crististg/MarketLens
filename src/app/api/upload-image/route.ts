import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
      ) => {
        return {
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB limit for images
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        };
      },
      onUploadCompleted: async ({ blob, clientPayload }) => {
        console.log('Blob upload completed', blob, clientPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}