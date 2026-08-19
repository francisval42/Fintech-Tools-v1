import { Router, type IRouter } from "express";
import healthRouter from "./health";
import toolsRouter from "./tools";
import toolRequestsRouter from "./tool-requests";
import usageEventsRouter from "./usage-events";

const router: IRouter = Router();

router.use(healthRouter);
router.use(toolsRouter);
router.use(toolRequestsRouter);
router.use(usageEventsRouter);

export default router;
