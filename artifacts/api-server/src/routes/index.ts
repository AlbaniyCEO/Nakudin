import { Router, type IRouter } from "express";
import healthRouter from "./health";
import feedRouter from "./feed";
import productsRouter from "./products";
import shopsRouter from "./shops";
import searchRouter from "./search";
import reportsRouter from "./reports";
import cloudinaryRouter from "./cloudinary";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(feedRouter);
router.use(productsRouter);
router.use(shopsRouter);
router.use(searchRouter);
router.use(reportsRouter);
router.use(cloudinaryRouter);
router.use(adminRouter);

export default router;
