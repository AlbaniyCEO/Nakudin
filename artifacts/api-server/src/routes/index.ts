import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedRouter from "./feed";
import productsRouter from "./products";
import shopsRouter from "./shops";
import searchRouter from "./search";
import reportsRouter from "./reports";
import uploadRouter from "./upload";
import adminRouter from "./admin";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(feedRouter);
router.use(productsRouter);
router.use(shopsRouter);
router.use(searchRouter);
router.use(reportsRouter);
router.use(uploadRouter);
router.use(adminRouter);
router.use(paymentsRouter);

export default router;
