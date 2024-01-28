import { createResource } from "solid-js";
import { client } from "../client";

const [users] = createResource(async () => client.users.query());

export { users };

