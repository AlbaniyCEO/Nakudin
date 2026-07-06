import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedRouter from "./feed";
import productsRouter from "./products";
import shopsRouter from "./shops";
import searchRouter from "./search";
import reportsRouter from "./reports";
import uploadRouter from "./upload";
import cloudinaryRouter from "./cloudinary";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import subscriptionLifecycleRouter from "./subscription-lifecycle";
import dailyPushRouter from "./daily-push";
import githubPushRouter from "./github-push";

const router: IRouter = Router();

router.use(githubPushRouter);
router.use(healthRouter);
router.use(feedRouter);
router.use(productsRouter);
router.use(shopsRouter);
router.use(searchRouter);
router.use(reportsRouter);
router.use(uploadRouter);
router.use(cloudinaryRouter);
router.use(paymentsRouter);
router.use(subscriptionLifecycleRouter);
router.use(dailyPushRouter);
router.use(adminRouter);

export default router;
