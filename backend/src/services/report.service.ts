import PDFDocument from "pdfkit";
import { prisma } from "../config/db";
import { AppError } from "../middleware/errorHandler";
import { maskAadhaar, maskPan } from "../utils/mask";
import { uploadPdfBuffer } from "./cloudinary.service";

// =====================================================
// Color palette + helpers
// =====================================================
const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  cardBg: "#fafbfc",
  verified: { bg: "#dcfce7", text: "#166534" },
  failed: { bg: "#fee2e2", text: "#991b1b" },
  partial: { bg: "#fef9c3", text: "#854d0e" },
  pending: { bg: "#e0e7ff", text: "#3730a3" },
  notRun: { bg: "#f1f5f9", text: "#475569" },
};

const statusColor = (s: string) => {
  switch (s) {
    case "VERIFIED":
      return COLORS.verified;
    case "FAILED":
      return COLORS.failed;
    case "PARTIAL":
      return COLORS.partial;
    case "PENDING":
      return COLORS.pending;
    default:
      return COLORS.notRun;
  }
};

const formatDate = (d: Date | string | null): string => {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDob = (d: Date | string): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface ReportInputs {
  userId: string;
  userName: string;
  userEmail: string;
  candidateId: string;
}

/**
 * Fetch a candidate (owned by the user) + its latest verification logs
 * and return a PDF buffer. Uses PDFKit (pure JS, no Chromium needed).
 */
export const generateReport = async (
  inputs: ReportInputs
): Promise<{ buffer: Buffer; fileName: string }> => {
  const { userId, userName, userEmail, candidateId } = inputs;

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, createdById: userId },
    include: { verificationLogs: { orderBy: { verifiedAt: "desc" } } },
  });
  if (!candidate) throw new AppError("Candidate not found", 404);

  const latestAadhaar = candidate.verificationLogs.find(
    (l) => l.verificationType === "AADHAAR"
  );
  const latestPan = candidate.verificationLogs.find(
    (l) => l.verificationType === "PAN"
  );

  const aadhaarStatus = latestAadhaar?.verificationStatus ?? "NOT_RUN";
  const panStatus = latestPan?.verificationStatus ?? "NOT_RUN";
  const aadhaarMessage =
    (latestAadhaar?.responsePayload as { message?: string } | null)?.message ??
    "Verification has not been run yet.";
  const panMessage =
    (latestPan?.responsePayload as { message?: string } | null)?.message ??
    "Verification has not been run yet.";

  const reportId = candidate.id.slice(-12).toUpperCase();
  const generatedAt = formatDate(new Date());

  // =====================================================
  // Build PDF
  // =====================================================
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth = doc.page.width - 100; // minus left+right margins
  const leftX = 50;

  // ----- Header -----
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(18);
  doc.text("BACKGROUND VERIFICATION REPORT", leftX, 50, { align: "left" });
  doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted);
  doc.text("Identity Verification — Aadhaar & PAN", leftX, 72);

  // Right-side meta
  doc.fontSize(9).fillColor(COLORS.muted);
  doc.text(`Report ID: ${reportId}`, leftX, 50, {
    width: pageWidth,
    align: "right",
  });
  doc.text(`Generated: ${generatedAt}`, leftX, 64, {
    width: pageWidth,
    align: "right",
  });

  // Header underline
  doc
    .moveTo(leftX, 95)
    .lineTo(leftX + pageWidth, 95)
    .lineWidth(2)
    .strokeColor(COLORS.ink)
    .stroke();

  // ----- Overall status banner -----
  const bannerY = 115;
  const bannerHeight = 60;
  doc
    .roundedRect(leftX, bannerY, pageWidth, bannerHeight, 6)
    .fillColor(COLORS.ink)
    .fill();

  doc.fillColor("#94a3b8").font("Helvetica").fontSize(8);
  doc.text("OVERALL VERIFICATION STATUS", leftX + 18, bannerY + 14, {
    characterSpacing: 1.5,
  });
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20);
  doc.text(candidate.status, leftX + 18, bannerY + 28);

  // status pill on right side of banner
  const pillColor = statusColor(candidate.status);
  const pillText = candidate.status;
  const pillTextWidth = doc.widthOfString(pillText);
  const pillWidth = pillTextWidth + 24;
  const pillX = leftX + pageWidth - pillWidth - 18;
  const pillY = bannerY + bannerHeight / 2 - 11;
  doc
    .roundedRect(pillX, pillY, pillWidth, 22, 11)
    .fillColor(pillColor.bg)
    .fill();
  doc.fillColor(pillColor.text).font("Helvetica-Bold").fontSize(10);
  doc.text(pillText, pillX, pillY + 6, {
    width: pillWidth,
    align: "center",
  });

  // ----- Candidate Information -----
  let y = bannerY + bannerHeight + 30;
  y = drawSectionTitle(doc, "CANDIDATE INFORMATION", leftX, y, pageWidth);

  const col1X = leftX;
  const col2X = leftX + pageWidth / 2 + 10;
  const colWidth = pageWidth / 2 - 20;

  drawField(doc, "Full Name", candidate.fullName, col1X, y, colWidth);
  drawField(doc, "Date of Birth", formatDob(candidate.dob), col2X, y, colWidth);
  y += 38;

  drawField(doc, "Email", candidate.email, col1X, y, colWidth);
  drawField(doc, "Phone", candidate.phone, col2X, y, colWidth);
  y += 38;

  drawField(
    doc,
    "Aadhaar Number",
    maskAadhaar(candidate.aadhaarNumber),
    col1X,
    y,
    colWidth
  );
  drawField(
    doc,
    "PAN Number",
    maskPan(candidate.panNumber),
    col2X,
    y,
    colWidth
  );
  y += 38;

  drawField(doc, "Address", candidate.address, col1X, y, pageWidth);
  y += 50;

  // ----- Verification Checks -----
  y = drawSectionTitle(doc, "VERIFICATION CHECKS", leftX, y, pageWidth);

  y = drawCheckCard(
    doc,
    "Aadhaar Verification",
    aadhaarStatus,
    aadhaarMessage,
    latestAadhaar ? formatDate(latestAadhaar.verifiedAt) : null,
    leftX,
    y,
    pageWidth
  );
  y += 12;
  y = drawCheckCard(
    doc,
    "PAN Verification",
    panStatus,
    panMessage,
    latestPan ? formatDate(latestPan.verifiedAt) : null,
    leftX,
    y,
    pageWidth
  );

  // ----- Footer (signature + disclaimer) -----
  const footerY = doc.page.height - 130;
  doc
    .moveTo(leftX, footerY)
    .lineTo(leftX + pageWidth, footerY)
    .lineWidth(1)
    .strokeColor(COLORS.line)
    .stroke();

  // Signature block (left)
  doc
    .moveTo(leftX, footerY + 45)
    .lineTo(leftX + 200, footerY + 45)
    .lineWidth(1)
    .strokeColor(COLORS.ink)
    .stroke();
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink);
  doc.text(userName, leftX, footerY + 50);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  doc.text(userEmail, leftX, footerY + 64);
  doc.fillColor("#94a3b8").fontSize(8);
  doc.text("Authorized Verifier", leftX, footerY + 76);

  // Disclaimer (right)
  doc.font("Helvetica").fontSize(8).fillColor("#94a3b8");
  const disclaimerX = leftX + pageWidth - 240;
  doc.text(
    "This report is generated electronically and is valid without a physical signature. Sensitive identity numbers are masked for privacy. All verification responses are retained in the audit log.",
    disclaimerX,
    footerY + 50,
    { width: 240, align: "right" }
  );

  doc.end();
  const buffer = await bufferPromise;

  const safeName = candidate.fullName.replace(/[^a-z0-9]/gi, "_");
  const fileName = `BGV_Report_${safeName}_${candidate.id.slice(-6)}.pdf`;

  // Fire-and-forget upload to Cloudinary. We don't await it — the user
  // gets the PDF instantly, and the shareable URL appears on the next
  // candidate detail load.
  uploadPdfBuffer(buffer, fileName)
    .then(async (result) => {
      if (!result) {
        console.log(
          `[Report] Skipped Cloudinary upload for ${candidate.id} (not configured)`
        );
        return;
      }
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          reportUrl: result.url,
          reportGeneratedAt: new Date(),
        },
      });
      console.log(
        `[Report] Uploaded to Cloudinary: ${result.url} (${result.bytes} bytes)`
      );
    })
    .catch((err) => {
      console.error("[Cloudinary upload failed]", err?.message ?? err);
    });

  return { buffer, fileName };
};

// =====================================================
// PDF drawing helpers
// =====================================================
function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number
): number {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.muted);
  doc.text(text, x, y, { characterSpacing: 1.2 });
  doc
    .moveTo(x, y + 14)
    .lineTo(x + width, y + 14)
    .lineWidth(0.5)
    .strokeColor(COLORS.line)
    .stroke();
  return y + 24;
}

function drawField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
  doc.text(label.toUpperCase(), x, y, { characterSpacing: 0.8, width });
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.ink);
  doc.text(value, x, y + 12, { width });
}

function drawCheckCard(
  doc: PDFKit.PDFDocument,
  name: string,
  status: string,
  message: string,
  verifiedAt: string | null,
  x: number,
  y: number,
  width: number
): number {
  const cardHeight = verifiedAt ? 78 : 60;

  // Background card
  doc
    .roundedRect(x, y, width, cardHeight, 6)
    .fillColor(COLORS.cardBg)
    .fill()
    .roundedRect(x, y, width, cardHeight, 6)
    .lineWidth(0.5)
    .strokeColor(COLORS.line)
    .stroke();

  // Name (left)
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(12);
  doc.text(name, x + 16, y + 14);

  // Status pill (right)
  const pillC = statusColor(status);
  const pillTextWidth = doc.widthOfString(status);
  const pillW = pillTextWidth + 20;
  const pillX = x + width - pillW - 16;
  const pillY = y + 12;
  doc.roundedRect(pillX, pillY, pillW, 20, 10).fillColor(pillC.bg).fill();
  doc.fillColor(pillC.text).font("Helvetica-Bold").fontSize(9);
  doc.text(status, pillX, pillY + 6, { width: pillW, align: "center" });

  // Message
  doc.fillColor("#475569").font("Helvetica").fontSize(10);
  doc.text(message, x + 16, y + 36, { width: width - 32 });

  // Timestamp
  if (verifiedAt) {
    doc.fillColor("#94a3b8").fontSize(8);
    doc.text(`Verified at: ${verifiedAt}`, x + 16, y + 56);
  }

  return y + cardHeight;
}
