import { TimeEntry } from "common";
import { Request, Response } from "express";

export function handle<Locals extends Record<string, any>>(
  fn: (req: Request, res: Response<any, Locals>) => any | Promise<any>,
) {
  return async function (req: Request, res: Response<any, Locals>) {
    try {
      await fn(req, res);
    } catch (err) {
      res
        .status(500)
        .send("Something went wrong (" + req.url + "):\n'" + err + "'.");
    }
  };
}

export function mergeDeep(...objects: Record<string, unknown>[]) {
  const isObject = (obj: any) => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.map((val, index) => mergeDeep(val, oVal[index]));
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(
          pVal as Record<string, unknown>,
          oVal as Record<string, unknown>,
        );
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

export function convertTags(tags: TimeEntry["task_tags"]) {
  const names = tags.map((t) => t.name);
  if (names.includes("admin")) {
    return "admin";
  } else if (names.includes("élec")) {
    return "elec";
  } else if (names.includes("info")) {
    return "info";
  } else if (names.includes("mec")) {
    return "mec";
  } else if (names.includes("livrables")) {
    return "livrables";
  }
  return "unknown";
}
