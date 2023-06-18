import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { UserSchema } from "../schemas/user";
import { api } from "./api";

const ResponseSchema = z.object({
  members: z.array(UserSchema),
});

type ResponseSchema = z.infer<typeof ResponseSchema>;

export async function getUsers() {
  const listId = "900300765608";
  const users = await api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/list/${listId}/member`
  );

  if (!users) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not find any users",
    });
  }

  return {
    members: users.members.filter((member) => member.initials !== "JG"),
  };
}
