import { createResource } from "solid-js";
import { client } from "../client";

const [users, { refetch: refetchUsers }] = createResource(async () =>
  client.users.query(),
);

export { refetchUsers, users };
