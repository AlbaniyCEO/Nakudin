import { Router } from "express";
import crypto from "crypto";

const router = Router();

router.post("/cloudinary/signature", async (req, res) => {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dgoczegss";
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "Nakudin";

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "Cloudinary not configured" });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = req.body?.folder || "nakudin";

  const params: Record<string, string | number> = {
    timestamp,
    upload_preset: uploadPreset,
    folder,
  };

  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join("&");

  const signature = crypto
    .createHash("sha256")
    .update(sortedParams + apiSecret)
    .digest("hex");

  res.json({ signature, timestamp, apiKey, cloudName, uploadPreset });
});

export default router;
