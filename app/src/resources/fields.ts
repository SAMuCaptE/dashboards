import { createResource } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";

const [fields, { refetch }] = createResource(async () =>
  client.fields.get.query({ dueDate: dueDate(), session: session() })
);

export { fields, refetch };
