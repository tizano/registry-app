import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";

export const trpcRouter = createTRPCRouter({
	auth: authRouter,
});
export type TRPCRouter = typeof trpcRouter;
