import axios from "axios";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { maskAadhaar, maskPan } from "../utils/mask";

interface MockResponse {
  status: "verified" | "failed";
  message: string;
  [key: string]: unknown;
}

// Call the configured Aadhaar verification provider.
// In dev this is our local /mock-api/aadhaar/verify; in prod it would be
// e.g. Karza/Surepass/IDfy's licensed endpoint.
const verifyAadhaarExternal = async (
  aadhaarNumber: string
): Promise<MockResponse> => {
  const { data } = await axios.post<MockResponse>(
    env.AADHAAR_API_URL,
    { aadhaarNumber },
    { timeout: 10000 }
  );
  return data;
};

// Call the configured PAN verification provider (NSDL / licensed vendor).
const verifyPanExternal = async (panNumber: string): Promise<MockResponse> => {
  const { data } = await axios.post<MockResponse>(
    env.PAN_API_URL,
    { panNumber },
    { timeout: 10000 }
  );
  return data;
};

/**
 * Run both Aadhaar + PAN verification for a candidate, log every call,
 * and update the candidate's overall status.
 *
 * Overall status logic:
 *  - both VERIFIED  -> VERIFIED
 *  - both FAILED    -> FAILED
 *  - mixed          -> PARTIAL
 */
export const startVerification = async (userId: string, candidateId: string) => {
  // Make sure user owns this candidate
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, createdById: userId },
  });
  if (!candidate) throw new AppError("Candidate not found", 404);

  // --- Aadhaar ---
  let aadhaarResponse: MockResponse;
  try {
    aadhaarResponse = await verifyAadhaarExternal(candidate.aadhaarNumber);
  } catch (e) {
    aadhaarResponse = {
      status: "failed",
      message:
        e instanceof Error
          ? `Aadhaar API error: ${e.message}`
          : "Aadhaar API unreachable",
    };
  }
  const aadhaarStatus =
    aadhaarResponse.status === "verified" ? "VERIFIED" : "FAILED";

  await prisma.verificationLog.create({
    data: {
      candidateId: candidate.id,
      verificationType: "AADHAAR",
      // Never log raw aadhaar number — store the masked version
      requestPayload: { aadhaarMasked: maskAadhaar(candidate.aadhaarNumber) },
      responsePayload: aadhaarResponse as unknown as object,
      verificationStatus: aadhaarStatus,
    },
  });

  // --- PAN ---
  let panResponse: MockResponse;
  try {
    panResponse = await verifyPanExternal(candidate.panNumber);
  } catch (e) {
    panResponse = {
      status: "failed",
      message:
        e instanceof Error ? `PAN API error: ${e.message}` : "PAN API unreachable",
    };
  }
  const panStatus = panResponse.status === "verified" ? "VERIFIED" : "FAILED";

  await prisma.verificationLog.create({
    data: {
      candidateId: candidate.id,
      verificationType: "PAN",
      requestPayload: { panMasked: maskPan(candidate.panNumber) },
      responsePayload: panResponse as unknown as object,
      verificationStatus: panStatus,
    },
  });

  // --- Compute overall status ---
  let overallStatus: "VERIFIED" | "FAILED" | "PARTIAL";
  if (aadhaarStatus === "VERIFIED" && panStatus === "VERIFIED") {
    overallStatus = "VERIFIED";
  } else if (aadhaarStatus === "FAILED" && panStatus === "FAILED") {
    overallStatus = "FAILED";
  } else {
    overallStatus = "PARTIAL";
  }

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { status: overallStatus },
  });

  return {
    candidateId: candidate.id,
    overallStatus,
    aadhaar: { status: aadhaarStatus, response: aadhaarResponse },
    pan: { status: panStatus, response: panResponse },
  };
};
