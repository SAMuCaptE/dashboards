import { createResource } from "solid-js";
import { client } from "../client";

const [users, { refetch }] = createResource(async () => client.users.query());

export { refetch, users };
