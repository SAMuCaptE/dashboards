import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import { z } from "zod";

type AppRouter = any;

export const client = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: import.meta.env.VITE_APP_SERVER_URL })],
  transformer: SuperJSON,
});

export function makeRequest(url: string) {
  async function request<S extends z.Schema>(
    schema: S,
    method: string,
    query: URLSearchParams | null,
    body: string | null,
  ): Promise<z.infer<S>> {
    const destination = new URL(url, import.meta.env.VITE_APP_SERVER_URL);
    if (query) {
      for (const [key, value] of query) {
        destination.searchParams.append(key, value);
      }
    }

    try {
      const response = await fetch(destination, { method, body });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        return schema.parse(data);
      } else {
        const data = await response.text();
        return schema.parse(data);
      }
    } catch (err) {
      const message =
        "could not fetch '" + destination.toString() + "': " + err;
      throw new Error(message);
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
      body?: Record<string, unknown> | string,
    ) {
      const bodyStr = body
        ? typeof body === "string"
          ? body
          : JSON.stringify(body)
        : null;
      return request(schema, "post", null, bodyStr);
    },
  };
}
