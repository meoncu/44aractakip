import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET } from '@/lib/r2';

export async function POST(request: Request) {
    try {
        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'Missing filename or filetype' }, { status: 400 });
        }

        const key = `policies/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

        return NextResponse.json({ url: signedUrl, key });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
