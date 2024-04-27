import { User } from "common";
import { createResource } from "solid-js";
import { z } from "zod";
import { makeRequest } from "../client";

const [users] = createResource(() =>
  makeRequest("/users")
    .get(z.object({ members: z.array(User) }))
    .catch(() => []),
);

export { users };

