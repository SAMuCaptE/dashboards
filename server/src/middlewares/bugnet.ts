import { Request, Response } from "express";

export const RATE_LIMITED = new Error("rate limited");

export function bugnet<Locals extends Record<string, any>>(
  fn: (req: Request, res: Response<any, Locals>) => any | Promise<any>,
) {
  return async function (req: Request, res: Response<any, Locals>) {
    try {
      await fn(req, res);
    } catch (err) {
      if (err === RATE_LIMITED) {
        res
          .status(429)
          .send("Rate limit reached (" + req.url + "):\n'" + err + ".");
        return;
      }

      res
        .status(500)
        .send("Something went wrong (" + req.url + "):\n'" + err + "'.");
    }
  };
}
