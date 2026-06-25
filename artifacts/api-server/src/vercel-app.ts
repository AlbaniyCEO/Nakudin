import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";
import { authMiddleware } from "./middlewares/auth";

// Minimal logger that matches the pino interface used in route handlers.
// Vercel captures all console output as function logs automatically.
function makeReqLog() {
  const fmt = (obj: unknown, msg?: string) =>
    msg ? `${msg} ${JSON.stringify(obj)}` : String(obj);
  return {
    info:  (obj: unknown, msg?: string) => console.log(fmt(obj, msg)),
    error: (obj: unknown, msg?: string) => console.error(fmt(obj, msg)),
    warn:  (obj: unknown, msg?: string) => console.warn(fmt(obj, msg)),
    debug: (obj: unknown, msg?: string) => console.debug(fmt(obj, msg)),
    trace: (obj: unknown, msg?: string) => console.debug(fmt(obj, msg)),
  };
}

const app: Express = express();

// Attach req.log so route handlers can call req.log.error / req.log.info
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).log = makeReqLog();
  next();
});

app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      if (typeof req.url === "string" && req.url.includes("/payments/webhook")) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);
app.use("/api", router);

export default app;
