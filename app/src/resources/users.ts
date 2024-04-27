import { User } from "common";
import { createResource } from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";

const [users] = createResource(() =>
  makeRequest("/users")
    .get(z.object({ members: z.array(User) }))
    .then(({ members }) =>
      members.sort((a, b) =>
        a.username.split(" ")[1].localeCompare(b.username.split(" ")[1]),
      ),
    )
    .catch(() => [] as User[]),
);

export { users };

