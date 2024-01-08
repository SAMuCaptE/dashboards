import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EpicListSchema, ListSchema } from "../schemas/list";
import { api } from "./api";

export async function getList(listId: string) {
  const data = await api(ListSchema).get(
    `https://api.clickup.com/api/v2/list/${listId}`,
  );

  if (!data) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find list",
    });
  }

  return data;
}

export async function getEpicList(listId: string) {
  const data = await api(EpicListSchema.or(z.any())).get(
    `https://api.clickup.com/api/v2/list/${listId}`,
  );

  if (!data) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find epic list",
    });
  }

  return data;
}
