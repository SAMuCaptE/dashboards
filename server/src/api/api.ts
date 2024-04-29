import { z } from "zod";
import { RATE_LIMITED } from "../middlewares/bugnet";

export function api<S extends z.Schema>(
  schema: S,
  options?: Omit<RequestInit, "method">,
) {
  const execute = async (
    method: "GET" | "POST",
    url: string,
  ): Promise<z.infer<S> | null> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: process.env.API_KEY!,
      },
      method,
    });
    const data = await response.json();

    if (response.status === 429) {
      console.log({ url, data });
      throw RATE_LIMITED;
    }

    const parsedData = schema.safeParse(data);
    if (!parsedData.success) {
      console.log({ url, data, error: parsedData.error });
      return null;
    }
    return parsedData.data;
  };

  return {
    get: (url: string) => execute("GET", url),
    post: (url: string) => execute("POST", url),
  };
}
