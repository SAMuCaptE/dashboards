import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "dashboards-server";
import SuperJSON from "superjson";
import { z } from "zod";

export const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: import.meta.env.VITE_APP_SERVER_URL })],
  transformer: SuperJSON,
});

export function server(url: string) {
  async function request<S extends z.Schema>(
    schema: S,
    method: string,
    query: URLSearchParams | null,
    body: string | null,
  ): Promise<z.infer<S> | null> {
    const destination = new URL(url, import.meta.env.VITE_APP_SERVER_URL);
    if (query) {
      for (const [key, value] of query) {
        destination.searchParams.append(key, value);
      }
    }

    try {
      const response = await fetch(destination, { method, body });

      if (response.headers.get("content-type") === "application/json") {
        const data = await response.json();
        return schema.parse(data);
      } else {
        const data = await response.text();
        return schema.parse(data);
      }
    } catch (err) {
      console.error("could not fetch '" + destination.toString() + "': " + err);
      return null;
    }
  }

  return {
    get: async function <S extends z.Schema>(
      schema: S,
      query?: URLSearchParams,
    ) {
      return request(schema, "get", query || null, null);
    },

    post: async function <S extends z.Schema>(
      schema: S,
      body?: Record<string, unknown>,
    ) {
      return request(schema, "post", null, body ? JSON.stringify(body) : null);
    },
  };
}
