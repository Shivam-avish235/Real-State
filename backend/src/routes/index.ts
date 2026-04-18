import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import { clientsRouter } from "../modules/clients/clients.routes";
import { communicationsRouter } from "../modules/communications/communications.routes";
import { dealsRouter } from "../modules/deals/deals.routes";
import { healthRouter } from "../modules/health/health.routes";
import { integrationsRouter } from "../modules/integrations/integrations.routes";
import { leadsRouter } from "../modules/leads/leads.routes";
import { notificationsRouter } from "../modules/notifications/notifications.routes";
import { propertiesRouter } from "../modules/properties/properties.routes";
import { reportsRouter } from "../modules/reports/reports.routes";
import { usersRouter } from "../modules/users/users.routes";
import { webhooksRouter } from "../modules/webhooks/webhooks.routes";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/deals", dealsRouter);
apiRouter.use("/communications", communicationsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/leads", leadsRouter);
apiRouter.use("/properties", propertiesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/integrations", integrationsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/webhooks", webhooksRouter);

export { apiRouter };
