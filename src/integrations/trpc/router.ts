import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";
import { entriesRouter } from "./routers/entries";

export const trpcRouter = createTRPCRouter({
	auth: authRouter,
	entries: entriesRouter,
});
export type TRPCRouter = typeof trpcRouter;
