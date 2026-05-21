/**
 * Generate sample verification reports — one per outcome (VERIFIED, FAILED,
 * PARTIAL). Run with:
 *
 *     npx ts-node scripts/generate-samples.ts
 *
 * Outputs are written to ../samples/ at the repo root.
 */
import fs from "fs";
import path from "path";
import { buildReportPdf, type ReportData } from "../src/services/report.service";

const samplesDir = path.resolve(__dirname, "../../samples");
fs.mkdirSync(samplesDir, { recursive: true });

const baseCandidate = {
  email: "john@example.com",
  phone: "9876543210",
  aadhaarMasked: "XXXX-XXXX-1234",
  panMasked: "ABCXXXXX4F",
  dob: new Date("1995-06-15"),
  address: "42 MG Road, Bengaluru, Karnataka 560001",
};

const verifiedBy = { name: "Recruiter Admin", email: "admin@example.com" };

const scenarios: { name: string; data: ReportData }[] = [
  {
    name: "sample_report_verified.pdf",
    data: {
      reportId: "SAMPLE-VRFD-001",
      generatedAt: new Date(),
      overallStatus: "VERIFIED",
      candidate: { ...baseCandidate, fullName: "Priya Sharma" },
      aadhaar: {
        status: "VERIFIED",
        message: "Aadhaar verified successfully",
        verifiedAt: new Date(),
      },
      pan: {
        status: "VERIFIED",
        message: "PAN verified successfully",
        verifiedAt: new Date(),
      },
      verifiedBy,
    },
  },
  {
    name: "sample_report_failed.pdf",
    data: {
      reportId: "SAMPLE-FAIL-002",
      generatedAt: new Date(),
      overallStatus: "FAILED",
      candidate: { ...baseCandidate, fullName: "Rohan Mehta" },
      aadhaar: {
        status: "FAILED",
        message: "Aadhaar verification failed: invalid format",
        verifiedAt: new Date(),
      },
      pan: {
        status: "FAILED",
        message: "PAN verification failed: invalid format",
        verifiedAt: new Date(),
      },
      verifiedBy,
    },
  },
  {
    name: "sample_report_partial.pdf",
    data: {
      reportId: "SAMPLE-PRTL-003",
      generatedAt: new Date(),
      overallStatus: "PARTIAL",
      candidate: { ...baseCandidate, fullName: "Asha Verma" },
      aadhaar: {
        status: "VERIFIED",
        message: "Aadhaar verified successfully",
        verifiedAt: new Date(),
      },
      pan: {
        status: "FAILED",
        message: "PAN verification failed: invalid format",
        verifiedAt: new Date(),
      },
      verifiedBy,
    },
  },
];

(async () => {
  for (const { name, data } of scenarios) {
    const buffer = await buildReportPdf(data);
    const outPath = path.join(samplesDir, name);
    fs.writeFileSync(outPath, buffer);
    console.log(`✓ ${name} (${buffer.length} bytes) → ${outPath}`);
  }
  console.log("\nAll sample reports generated.");
})();
