import { User } from "common";
import { z } from "zod";
import { api } from "./api";

const ResponseSchema = z.object({ members: z.array(User) });
type ResponseSchema = z.infer<typeof ResponseSchema>;

export async function getUsers() {
  const listId = "901100130356";
  const users = await api(ResponseSchema).get(
    `https://api.clickup.com/api/v2/list/${listId}/member`,
  );

  if (!users) {
    throw new Error("Could not find any users");
  }

  return {
    members: users.members.filter(
      (member) => !["JG", "TE", "RA"].includes(member.initials),
    ),
  };
}
