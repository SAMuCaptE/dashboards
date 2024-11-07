import { z } from "zod";
import { RATE_LIMITED } from "../middlewares/bugnet";

const keys = process.env.API_KEY!.split(",");

export function api<S extends z.Schema>(
  schema: S,
  options?: Omit<RequestInit, "method">,
) {
  const execute = async (
    method: "GET" | "POST",
    url: string,
    attemptsLeft = 3,
  ): Promise<z.infer<S> | null> => {
    const key = keys[0];
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: key,
      },
      method,
    });
    const data = await response.json();

    if (response.status === 429) {
      // Put used api key to the end of the queue
      if (keys[0] === key) {
        keys.push(keys.shift()!);
      }

      if (attemptsLeft > 0) {
        console.log("Rate limit reached, swapping api keys.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        return execute(method, url, attemptsLeft - 1);
      } else {
        console.log({ url, data });
        throw RATE_LIMITED;
      }
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
