import dotenv from "dotenv";

dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  PORT: parseInt(process.env.PORT ?? "5000", 10),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",

  // Verification provider endpoints — separate URLs so each provider can be
  // swapped or mocked independently. In dev both point at our mock routes.
  AADHAAR_API_URL:
    process.env.AADHAAR_API_URL ??
    "http://localhost:5000/mock-api/aadhaar/verify",
  PAN_API_URL:
    process.env.PAN_API_URL ?? "http://localhost:5000/mock-api/pan/verify",

  // Cloudinary (optional — if any of cloud_name/api_key/api_secret is missing,
  // the upload step is skipped and the PDF is still streamed normally).
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  CLOUDINARY_UPLOAD_FOLDER:
    process.env.CLOUDINARY_UPLOAD_FOLDER ?? "bgv-reports",

  // Optional S3 (not used — Cloudinary is the active file store)
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME ?? "",
};

export const isCloudinaryConfigured = (): boolean =>
  Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
  );
