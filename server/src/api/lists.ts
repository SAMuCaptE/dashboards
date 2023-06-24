import { TRPCError } from "@trpc/server";
import { ListSchema } from "../schemas/list";
import { api } from "./api";

export async function getList(listId: string) {
  const data = await api(ListSchema).get(
    `https://api.clickup.com/api/v2/list/${listId}`
  );

  if (!data) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find list",
    });
  }

  return data;
}
