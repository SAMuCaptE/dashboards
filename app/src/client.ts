import { createSignal } from "solid-js";
import { z } from "zod";

let timeout: number | null = null;
const [rateLimited, setRateLimited] = createSignal<Date | null>(null);
export { rateLimited };

export function makeRequest(url: string) {
  async function request<S extends z.Schema>(
    schema: S,
    query: URLSearchParams | null,
    details: RequestInit,
  ): Promise<z.infer<S>> {
    const destination = new URL(url, import.meta.env.VITE_APP_SERVER_URL);
    if (query) {
      for (const [key, value] of query) {
        destination.searchParams.append(key, value);
      }
    }

    try {
      const response = await fetch(destination, details);
      if (response.status === 429) {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => setRateLimited(null), 60_000);
        setRateLimited(new Date());
      }

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

  function requestWithBody(method: string) {
    return async function <S extends z.Schema>(
      schema: S,
      body?: Record<string, unknown> | string,
    ) {
      const headers = new Headers();

      switch (typeof body) {
        case "string":
          body = body;
          break;
        case "object":
          body = JSON.stringify(body);
          headers.set("Content-Type", "application/json");
          break;
      }

      return request(schema, null, { method, body, headers });
    };
  }

  return {
    get: async function <S extends z.Schema>(
      schema: S,
      query?: URLSearchParams,
    ) {
      return request(schema, query || null, { method: "get" });
    },
    put: requestWithBody("put"),
    post: requestWithBody("post"),
    delete: requestWithBody("delete"),
  };
}
