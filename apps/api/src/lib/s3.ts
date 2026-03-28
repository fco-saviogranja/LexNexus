import { randomUUID, createHash } from "node:crypto";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER ?? "documents";

export const hasStorageConfig = Boolean(accountName && accountKey);

const sharedKeyCred = hasStorageConfig
  ? new StorageSharedKeyCredential(accountName!, accountKey!)
  : null;

const blobServiceClient = hasStorageConfig
  ? new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCred!,
    )
  : null;

export const hashBuffer = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex");

export async function uploadDocument(buffer: Buffer, fileName: string, mimeType: string) {
  if (!blobServiceClient || !sharedKeyCred) {
    return {
      key: `mock/${randomUUID()}-${fileName}`,
      blobUrl: `https://mock-storage.local/${fileName}`,
    };
  }

  const key = `documents/${new Date().getFullYear()}/${randomUUID()}-${fileName}`;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  const blobUrl = blockBlobClient.url;
  return { key, blobUrl };
}

export async function getSignedBlobUrl(keyOrUrl: string) {
  if (keyOrUrl.startsWith("/")) {
    return keyOrUrl;
  }

  if (keyOrUrl.startsWith("http") && !keyOrUrl.includes(".blob.core.windows.net/")) {
    return keyOrUrl;
  }

  if (!blobServiceClient || !sharedKeyCred) {
    return keyOrUrl;
  }

  const key =
    keyOrUrl.includes("/") && keyOrUrl.startsWith("http")
      ? new URL(keyOrUrl).pathname.replace(`/${containerName}/`, "")
      : keyOrUrl;

  if (!key) {
    return keyOrUrl;
  }

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(key);

  const startsOn = new Date();
  const expiresOn = new Date(startsOn.getTime() + 15 * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName: key,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
    },
    sharedKeyCred,
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}
