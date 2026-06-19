import { Router, type IRouter } from "express";
import healthRouter from "./health";
import childrenRouter from "./children";
import appsRouter from "./apps";
import childAppStatusRouter from "./child-app-status";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(childrenRouter);
router.use(appsRouter);
router.use(childAppStatusRouter);
router.use(exportRouter);

export default router;
