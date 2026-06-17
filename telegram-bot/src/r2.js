import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const {
  R2_ENDPOINT,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
} = process.env;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  throw new Error("R2_* env vars are not fully configured");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Stream a readable directly to R2 using multipart upload.
 * Memory stays bounded regardless of file size.
 */
export async function streamToR2({ key, body, contentType }) {
  const uploader = new Upload({
    client: r2,
    params: {
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    queueSize: 4,             // parallel parts
    partSize: 10 * 1024 * 1024, // 10 MB per part
    leavePartsOnError: false,
  });

  await uploader.done();
  return `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}

export async function deleteFromR2(key) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
