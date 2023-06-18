import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "dashboards-server";
import SuperJSON from "superjson";

export const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: "http://localhost:16987" })],
  transformer: SuperJSON,
});
