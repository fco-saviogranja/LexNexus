import { randomUUID, createHash } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION ?? "us-east-1";
const bucket = process.env.S3_BUCKET;

export const hasS3Config = Boolean(endpoint && bucket && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);

export const s3 = hasS3Config
  ? new S3Client({
      region,
      endpoint,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!
      }
    })
  : null;

export const hashBuffer = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex");

export async function uploadPdf(buffer: Buffer, fileName: string) {
  if (!s3 || !bucket) {
    return {
      key: `mock/${randomUUID()}-${fileName}`,
      blobUrl: `https://mock-storage.local/${fileName}`
    };
  }

  const key = `documents/${new Date().getFullYear()}/${randomUUID()}-${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf"
    })
  );

  const blobUrl = `${endpoint}/${bucket}/${key}`;
  return { key, blobUrl };
}

export async function getSignedPdfUrl(keyOrUrl: string) {
  if (!s3 || !bucket) {
    return keyOrUrl;
  }

  const key = keyOrUrl.includes("/") && keyOrUrl.startsWith("http")
    ? keyOrUrl.split(`/${bucket}/`)[1]
    : keyOrUrl;

  if (!key) {
    return keyOrUrl;
  }

  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }),
    { expiresIn: 60 * 15 }
  );
}
