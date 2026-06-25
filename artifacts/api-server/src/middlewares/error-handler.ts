import { type Request, type Response, type NextFunction } from "express";
  import { ZodError } from "zod/v4";

  export interface HttpError extends Error {
    status?: number;
    statusCode?: number;
  }

  /**
   * Global Express error handler. Must be registered AFTER all routes as the
   * last app.use() call. Returns structured JSON so the frontend always gets
   * { error, details? } rather than an HTML stack trace.
   */
  export function globalErrorHandler(
    err: HttpError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ): void {
    // Zod validation errors → 400 with field-level details
    if (err instanceof ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    // PostgreSQL unique-violation (23505) → 409 Conflict
    const pgCode = (err as any)?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "A record with those details already exists." });
      return;
    }
    if (pgCode === "23503") {
      res.status(400).json({ error: "Referenced record does not exist." });
      return;
    }

    // Explicit HTTP status attached by route handlers
    const status = err.status ?? err.statusCode ?? 500;

    // Log server errors; skip 4xx client errors to reduce noise
    if (status >= 500) {
      (req as any).log?.error({ err }, err.message ?? "Unhandled error");
    }

    // Never expose internal details in production
    const isProd = process.env.NODE_ENV === "production";
    res.status(status).json({
      error:
        status < 500
          ? (err.message || "Bad request")
          : isProd
            ? "An unexpected error occurred. Please try again."
            : (err.message || "Internal server error"),
    });
  }
  