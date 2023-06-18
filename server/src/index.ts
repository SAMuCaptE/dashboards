import { createServer } from "http";
import { z } from "zod";

import { getUsers } from "./api/get-users";
import { getBudget } from "./api/money";
import { getSpaces } from "./api/spaces";
import { getWorkedHours } from "./api/worked-hours";
import "./env";

type Handler<S extends z.Schema> = {
  handler: (...args: z.infer<S>) => any;
  schema: S;
};

const NoArgs = z.object({});

function makeRoute<S extends z.Schema>(
  handler: (args: z.infer<S>) => any,
  schema: S
): Handler<S> {
  return { handler, schema };
}

const port = 16987 || process.env.PORT;

const routes = {
  "/": makeRoute(() => "Server is running", NoArgs),
  "/users": makeRoute(getUsers, NoArgs),
  "/hours": makeRoute(
    getWorkedHours,
    z.object({
      start: z.string().transform((str) => new Date(parseInt(str))),
      end: z.string().transform((str) => new Date(parseInt(str))),
    })
  ),
  "/budget": makeRoute(
    getBudget,
    z.object({
      date: z.string().transform((str) => new Date(parseInt(str))),
    })
  ),
  "/spaces": makeRoute(getSpaces, NoArgs),
};

async function getData(url: string) {
  const [path, rawArgs] = url.split("?");
  const args =
    rawArgs?.split("&").reduce((prev, curr) => {
      const [key, value] = curr.split("=");
      return { ...prev, [key]: value };
    }, {}) ?? {};

  for (const [routePath, route] of Object.entries(routes)) {
    if (routePath === path) {
      const parsedArgs = route.schema.parse(args);
      const payload = await route.handler(parsedArgs);
      return payload;
    }
  }
}

const server = createServer(async (req, res) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
    "Access-Control-Max-Age": 2592000,
  };

  try {
    const data = await getData(req.url ?? "");
    const parsedData = JSON.stringify(data);
    res.writeHead(200, headers);
    res.end(parsedData);
  } catch (err) {
    res.writeHead(400);
    if (typeof err === "object" && err instanceof Error) {
      res.end(err.name + " : " + err.message);
    } else {
      res.end("Unknown error");
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
