import { Request, Response } from "express";

type CacheSettings<Locals extends Record<string, any>> = {
  expiration: number;
  dependsOn: (req: Request, res: Response<any, Locals>) => Array<unknown>;
};

type CacheRecord<Locals extends Record<string, any> = Record<string, any>> = {
  timestamp: number;
  settings: CacheSettings<Locals>;
  params: Array<unknown>;
  response: {
    status: number;
    value: unknown;
    type: "text" | "json" | "none";
  };
};

let nextId = 0;
export const cached: Record<number, CacheRecord<any>> = {};

export function cache<Locals extends Record<string, any>>(
  handler: (req: Request, res: Response<any, Locals>) => any | Promise<any>,
  settings?: Partial<CacheSettings<Locals>>,
) {
  const id = nextId++;
  const appliedSettings = {
    expiration: settings?.expiration ?? 60_000,
    dependsOn: settings?.dependsOn ?? (() => []),
  };

  return async function (req: Request, res: Response<any, Locals>) {
    const params = appliedSettings.dependsOn(req, res);
    let record = getRecord<Locals>(id, params);

    console.log(
      `(${new Date().toISOString()}) Request to '${req.url.toString()}': ${
        record ? "CACHED" : "FETCHING"
      }`,
    );

    if (record) {
      if (record.response.type === "text") {
        res.send(record.response.value).status(record.response.status);
      } else if (record.response.type === "json") {
        res.json(record.response.value).status(record.response.status);
      } else {
        res.sendStatus(record.response.status);
      }
      return;
    }

    record = {
      timestamp: new Date().getTime(),
      settings: appliedSettings,
      params: appliedSettings.dependsOn(req, res),
      response: {
        status: 409,
        value: null,
        type: "none",
      },
    };

    const originalStatus = res.status;
    const originalSendStatus = res.sendStatus;
    const originalSend = res.send;
    const originalJson = res.json;

    res.status = (code: number) => {
      record!.response.status = code;
      return originalStatus.bind(res)(code);
    };
    res.sendStatus = (code: number) => {
      record!.response.status = code;
      record!.response.type = "none";
      return originalSendStatus.bind(res)(code);
    };
    res.send = (body: any) => {
      record!.response.value = body;
      record!.response.type = "text";
      return originalSend.bind(res)(body);
    };
    res.json = (body: any) => {
      record!.response.value = body;
      record!.response.type = "json";
      return originalJson.bind(res)(body);
    };

    await handler(req, res);
    cached[id] = record!;
  };
}

function getRecord<Locals extends Record<string, any>>(
  id: number,
  params: Array<unknown>,
): CacheRecord<Locals> | null {
  if (!cached[id]) {
    return null;
  }
  if (
    new Date().getTime() >=
    cached[id].timestamp + cached[id].settings.expiration
  ) {
    delete cached[id];
    return null;
  }

  const record = cached[id];
  if (record.params.length !== params.length) {
    delete cached[id];
    return null;
  }

  if (record.params.some((param, i) => params[i] !== param)) {
    delete cached[id];
    return null;
  }

  return record;
}

export function clearCache() {
  for (const key of Object.keys(cached)) {
    delete cached[key as any];
  }
  console.log("cleared cache");
}
