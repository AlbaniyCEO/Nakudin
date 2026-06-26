import { Router } from "express";

  const router = Router();

  /**
   * POST /uploads/image
   * Body: { data: string (base64), contentType: string }
   * Uploads to Vercel Blob and returns { url }.
   * Requires BLOB_READ_WRITE_TOKEN env var.
   */
  router.post("/uploads/image", async (req, res) => {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      return res.status(500).json({ error: "Image storage not configured — set BLOB_READ_WRITE_TOKEN" });
    }

    const { data, contentType } = req.body;
    if (!data) return res.status(400).json({ error: "No image data provided" });

    const ext = (contentType || "image/jpeg").split("/")[1]?.split("+")[0] || "jpg";
    const name = `nakudin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const binary = Buffer.from(data, "base64");
      const r = await fetch(`https://blob.vercel-storage.com/${name}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${blobToken}`,
          "x-content-type": contentType || "image/jpeg",
          "x-add-random-suffix": "0",
        },
        body: binary,
      });

      if (!r.ok) {
        const text = await r.text();
        (req as any).log?.error({ status: r.status, text }, "Vercel Blob upload failed");
        return res.status(500).json({ error: "Upload failed" });
      }

      const blob = await r.json() as { url: string };
      return res.json({ url: blob.url });
    } catch (err) {
      (req as any).log?.error({ err }, "Upload error");
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  export default router;
  