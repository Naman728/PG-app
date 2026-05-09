import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { ownerRouter } from "./owner.routes.js";
import { tenantRouter } from "./tenant.routes.js";

export const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/owner", ownerRouter);
v1Router.use("/tenant", tenantRouter);
