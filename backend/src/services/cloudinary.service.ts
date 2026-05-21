import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "../config/env";

// Lazy-configure on first use so the app boots fine without Cloudinary keys.
let configured = false;
const ensureConfigured = () => {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
};

export interface UploadResult {
  url: string;        // shareable HTTPS URL
  publicId: string;   // for future delete/replace
  bytes: number;
}

// One-time visibility on startup so devs know whether uploads are active.
let warned = false;
const warnIfMissing = () => {
  if (warned) return;
  warned = true;
  if (!isCloudinaryConfigured()) {
    console.warn(
      "[Cloudinary] Disabled — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env to enable shareable report links."
    );
  } else {
    console.log("[Cloudinary] Configured — reports will be uploaded.");
  }
};

/**
 * Upload a PDF buffer to Cloudinary as a "raw" resource type.
 * Returns null if Cloudinary is not configured (graceful fallback).
 */
export const uploadPdfBuffer = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadResult | null> => {
  warnIfMissing();
  if (!isCloudinaryConfigured()) return null;
  ensureConfigured();

  // public_id (filename inside the bucket) — strip the .pdf extension since
  // we'll let Cloudinary handle the format.
  const baseName = fileName.replace(/\.pdf$/i, "");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: env.CLOUDINARY_UPLOAD_FOLDER,
        public_id: `${baseName}_${Date.now()}`,
        format: "pdf",
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload returned empty"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
};
