import { EpicList, List } from "common";
import { z } from "zod";
import { api } from "./api";

export async function getList(listId: string) {
  const data = await api(List).get(
    `https://api.clickup.com/api/v2/list/${listId}`,
  );

  if (!data) {
    throw new Error("Could not find list");
  }

  return data;
}

export async function getEpicList(listId: string) {
  const data = await api(EpicList.or(z.any())).get(
    `https://api.clickup.com/api/v2/list/${listId}`,
  );

  if (!data) {
    throw new Error("Could not find epic list");
  }

  return data;
}
