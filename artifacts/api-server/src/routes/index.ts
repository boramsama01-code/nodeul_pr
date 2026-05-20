import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import usersRouter from "./users";
import organizationsRouter from "./organizations";
import eventsRouter from "./events";
import promotionZonesRouter from "./promotionZones";
import promotionRequestsRouter from "./promotionRequests";
import assetsRouter from "./assets";
import schedulesRouter from "./schedules";
import commentsRouter from "./comments";
import emailRouter from "./email";
import adminRouter from "./admin";
import npcRouter from "./npc";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(usersRouter);
router.use(organizationsRouter);
router.use(eventsRouter);
router.use(promotionZonesRouter);
router.use(promotionRequestsRouter);
router.use(assetsRouter);
router.use(schedulesRouter);
router.use(commentsRouter);
router.use(emailRouter);
router.use(adminRouter);
router.use(npcRouter);

export default router;
