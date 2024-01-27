import { createResource } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";

const [fields, { refetch: refetchFields }] = createResource(async () =>
  client.fields.get.query({ dueDate, session }),
);

export { fields, refetchFields };
