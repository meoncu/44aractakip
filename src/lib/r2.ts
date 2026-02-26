import { S3Client } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = '75549bb6c60165f8190d3c0803706fff';

export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '', // User will need to fill this in
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '', // User will need to fill this in
    },
});

export const R2_BUCKET = '44aractakip';
export const R2_PUBLIC_URL = 'https://pub-7389ffc93306438881825d1043da76d1.r2.dev';
