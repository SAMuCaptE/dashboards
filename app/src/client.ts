import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "dashboards-server";
import SuperJSON from "superjson";

export const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: import.meta.env.VITE_APP_SERVER_URL })],
  transformer: SuperJSON,
});
