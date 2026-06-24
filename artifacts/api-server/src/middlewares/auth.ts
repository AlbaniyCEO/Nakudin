import type { Request, Response, NextFunction } from "express";

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    (req as any).userId = null;
    (req as any).userEmail = null;
    return next();
  }

  const token = authHeader.slice(7);

  try {
    // Verify Firebase ID token by calling Firebase REST API
    const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY}`;
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      (req as any).userId = null;
      (req as any).userEmail = null;
      return next();
    }

    const data = await response.json() as any;
    const user = data.users?.[0];

    if (user) {
      (req as any).userId = user.localId;
      (req as any).userEmail = user.email;
    } else {
      (req as any).userId = null;
      (req as any).userEmail = null;
    }
  } catch {
    (req as any).userId = null;
    (req as any).userEmail = null;
  }

  next();
}
