import { Router, Request, Response } from "express";

/**
 * Mock verification APIs.
 *
 * Verification rule = the regex specified in the PDF blueprint:
 *  - Aadhaar: /^\d{12}$/                          -> 12 digits
 *  - PAN:     /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/        -> ABCDE1234F format
 *
 * If the format matches  -> "verified"
 * If the format fails    -> "failed"
 *
 * NOTE: These are mocks. Real Aadhaar/PAN verification requires UIDAI / NSDL
 * licensed APIs and validates against actual government records — not just
 * the format. We follow the PDF spec which only provides regex-level rules.
 */

const aadhaarRegex = /^\d{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const router = Router();

router.post("/aadhaar/verify", (req: Request, res: Response) => {
  const { aadhaarNumber } = req.body ?? {};

  if (typeof aadhaarNumber !== "string" || !aadhaarRegex.test(aadhaarNumber)) {
    return res.json({
      status: "failed",
      nameMatch: false,
      dobMatch: false,
      message: "Aadhaar verification failed: invalid format",
    });
  }

  return res.json({
    status: "verified",
    nameMatch: true,
    dobMatch: true,
    message: "Aadhaar verified successfully",
  });
});

router.post("/pan/verify", (req: Request, res: Response) => {
  const { panNumber } = req.body ?? {};

  if (typeof panNumber !== "string" || !panRegex.test(panNumber)) {
    return res.json({
      status: "failed",
      panStatus: "inactive",
      message: "PAN verification failed: invalid format",
    });
  }

  return res.json({
    status: "verified",
    panStatus: "active",
    message: "PAN verified successfully",
  });
});

export default router;
