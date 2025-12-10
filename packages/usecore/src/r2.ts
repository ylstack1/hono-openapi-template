import jwt from "@tsndr/cloudflare-worker-jwt";
import { tryCatch, type Result } from "catch-wrap";

export interface R2UploadOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  onUploadProgress?: (progress: number) => void;
}

export interface R2MultipartUploadOptions extends R2UploadOptions {
  chunkSize?: number;
}

export interface R2SignedUrlOptions {
  expiresIn?: number;
  method?: "GET" | "PUT";
  secret: string;
  bucketName: string;
}

export interface R2DownloadOptions {
  range?: R2Range;
  onDownloadProgress?: (progress: number) => void;
}

export class R2Client {
  constructor(private readonly bucket: R2Bucket) {}

  async upload(
    key: string,
    data: ArrayBuffer | ReadableStream | string,
    options?: R2UploadOptions,
  ): Promise<Result<R2Object>> {
    return await tryCatch(async () => {
      const body =
        typeof data === "string" ? new TextEncoder().encode(data) : data;

      const result = await this.bucket.put(key, body, {
        httpMetadata: options?.httpMetadata,
        customMetadata: options?.customMetadata,
      });

      if (!result) {
        throw new Error("Upload failed");
      }

      return result;
    });
  }

  async uploadMultipart(
    key: string,
    data: ArrayBuffer,
    options?: R2MultipartUploadOptions,
  ): Promise<Result<R2Object>> {
    return await tryCatch(async () => {
      const chunkSize = options?.chunkSize || 5 * 1024 * 1024;
      const totalSize = data.byteLength;
      const chunks = Math.ceil(totalSize / chunkSize);

      const upload = await this.bucket.createMultipartUpload(key, {
        httpMetadata: options?.httpMetadata,
        customMetadata: options?.customMetadata,
      });

      const parts: R2UploadedPart[] = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = data.slice(start, end);

        const part = await upload.uploadPart(i + 1, chunk);
        parts.push(part);

        if (options?.onUploadProgress) {
          const progress = Math.round(((i + 1) / chunks) * 100);
          options.onUploadProgress(progress);
        }
      }

      const result = await upload.complete(parts);
      return result;
    });
  }

  async download(
    key: string,
    options?: R2DownloadOptions,
  ): Promise<Result<R2ObjectBody | null>> {
    return await tryCatch(async () => {
      const obj = await this.bucket.get(key, {
        range: options?.range,
      });

      return obj;
    });
  }

  async downloadStream(key: string): Promise<Result<ReadableStream | null>> {
    return await tryCatch(async () => {
      const obj = await this.bucket.get(key);
      return obj?.body || null;
    });
  }

  async delete(key: string): Promise<Result<void>> {
    return await tryCatch(async () => {
      await this.bucket.delete(key);
    });
  }

  async deleteMultiple(keys: string[]): Promise<Result<void>> {
    return await tryCatch(async () => {
      await this.bucket.delete(keys);
    });
  }

  async head(key: string): Promise<Result<R2Object | null>> {
    return await tryCatch(async () => {
      return await this.bucket.head(key);
    });
  }

  async list(options?: R2ListOptions): Promise<Result<R2Objects>> {
    return await tryCatch(async () => {
      return await this.bucket.list(options);
    });
  }

  async generateSignedUrl(
    key: string,
    options: R2SignedUrlOptions,
  ): Promise<Result<string>> {
    return await tryCatch(async () => {
      const expiresIn = options.expiresIn || 3600;
      const method = options.method || "GET";

      const payload = {
        key,
        method,
        exp: Math.floor(Date.now() / 1000) + expiresIn,
      };

      const token = await jwt.sign(payload, options.secret);

      const url = new URL(
        `https://r2.cloudflarestorage.com/${options.bucketName}/${key}`,
      );
      url.searchParams.set("token", token);
      url.searchParams.set("method", method);

      return url.toString();
    });
  }

  async verifySignedUrl(
    url: string,
    secret: string,
  ): Promise<Result<{ key: string; method: string }>> {
    return await tryCatch(async () => {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");
      const method = urlObj.searchParams.get("method");

      if (!token || !method) {
        throw new Error("Invalid signed URL");
      }

      const result = await jwt.verify(token, secret);
      if (!result) {
        throw new Error("Invalid or expired signature");
      }

      const payload = result.payload as {
        key: string;
        method: string;
      };

      return { key: payload.key, method: payload.method };
    });
  }

  async setExpiration(key: string, expiresAt: Date): Promise<Result<R2Object>> {
    return await tryCatch(async () => {
      const obj = await this.bucket.get(key);
      if (!obj) {
        throw new Error("Object not found");
      }

      const body = await obj.arrayBuffer();

      const result = await this.bucket.put(key, body, {
        httpMetadata: obj.httpMetadata,
        customMetadata: {
          ...obj.customMetadata,
          expiresAt: expiresAt.toISOString(),
        },
      });

      if (!result) {
        throw new Error("Failed to set expiration");
      }

      return result;
    });
  }

  async cleanup(olderThan: Date): Promise<Result<number>> {
    return await tryCatch(async () => {
      let deleted = 0;
      let cursor: string | undefined;

      do {
        const list = await this.bucket.list({ cursor });

        for (const obj of list.objects) {
          const uploaded = new Date(obj.uploaded);
          if (uploaded < olderThan) {
            await this.bucket.delete(obj.key);
            deleted++;
          }
        }

        cursor = list.truncated ? list.cursor : undefined;
      } while (cursor);

      return deleted;
    });
  }

  async cleanupExpired(): Promise<Result<number>> {
    return await tryCatch(async () => {
      let deleted = 0;
      const now = new Date();
      let cursor: string | undefined;

      do {
        const list = await this.bucket.list({ cursor });

        for (const obj of list.objects) {
          if (obj.customMetadata?.["expiresAt"]) {
            const expiresAt = new Date(obj.customMetadata["expiresAt"]);
            if (expiresAt < now) {
              await this.bucket.delete(obj.key);
              deleted++;
            }
          }
        }

        cursor = list.truncated ? list.cursor : undefined;
      } while (cursor);

      return deleted;
    });
  }
}

export function createR2Client(bucket: R2Bucket): R2Client {
  return new R2Client(bucket);
}
