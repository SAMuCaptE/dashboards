import { Fields } from "dashboards-server";
import { Component, JSX } from "solid-js";
import { client } from "../client";
import { refetch as refetchFields } from "../resources/fields";
import { dueDate, session } from "../stores/params";
import Editable from "./Editable";

const Page: Component<{ children: JSX.Element; data: Fields }> = (props) => {
  return (
    <main class="w-[8.5in] h-[11in] border-black border-2 mx-auto block my-5 relative">
      {props.children}
      <footer class="opacity-80 absolute bottom-4 left-1/2 -translate-x-1/2">
        <Editable
          initialValue={props.data.meeting.date}
          onEdit={async (v) => {
            await client.fields.date.edit.mutate({
              session: session(),
              dueDate: dueDate(),
              date: v,
            });
            refetchFields();
          }}
        >
          <p class="text-sm">
            <strong>SAUM</strong> - {props.data.meeting.date}
          </p>
        </Editable>
      </footer>
    </main>
  );
};

export default Page;
