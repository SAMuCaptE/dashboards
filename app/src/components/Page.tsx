import { Component, createResource, JSX, Suspense } from "solid-js";
import { z } from "zod";

import { makeRequest } from "../client";
import { dueDate, session } from "../stores/params";
import Editable from "./Editable";
import Loader from "./Loader";

const Page: Component<{ children: JSX.Element }> = (props) => {
  const [meetingDate, { refetch }] = createResource(() =>
    makeRequest(`/fields/${session}/${dueDate}/footer`)
      .get(z.string())
      .catch(() => null),
  );

  async function handlerFooterUpdate(date: string) {
    await makeRequest(`/fields/${session}/${dueDate}/footer`).post(
      z.any(),
      date,
    );
    await refetch();
  }

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
            onEdit={handlerFooterUpdate}
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
