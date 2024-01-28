import { Component, createResource, JSX, Suspense } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";
import Editable from "./Editable";
import Loader from "./Loader";

const Page: Component<{ children: JSX.Element }> = (props) => {
  const [meetingDate, { refetch }] = createResource(() =>
    client.fields.date.get.query({ session, dueDate }).catch(() => null),
  );

  return (
    <main class="w-[8.5in] h-[11in] border-black border-2 mx-auto block my-5 relative">
      {props.children}

      <footer class="opacity-80 absolute bottom-4 left-1/2 -translate-x-1/2">
        <Suspense
          fallback={
            <div class="mx-auto w-fit">
              <Loader />
            </div>
          }
        >
          <Editable
            initialValue={meetingDate() ?? ""}
            onEdit={async (v) => {
              await client.fields.date.edit.mutate({
                session,
                dueDate,
                date: v,
              });
              await refetch();
            }}
          >
            <p class="text-sm">
              <strong>SAUM</strong> - {meetingDate() ?? "Erreur"}
            </p>
          </Editable>
        </Suspense>
      </footer>
    </main>
  );
};

export default Page;
