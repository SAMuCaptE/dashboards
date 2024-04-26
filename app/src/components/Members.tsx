import { Component, createResource, For, Suspense } from "solid-js";
import { client } from "../client";
import { dueDate, session } from "../stores/params";
import Editable from "./Editable";
import Loader from "./Loader";

const colors = [
  "bg-red-600",
  "bg-orange-600",
  "bg-yellow-400",
  "bg-lime-200",
  "bg-green-400",
  "bg-fuchsia-400",
];

const Members: Component = () => {
  const [members, { refetch }] = createResource(() =>
    client.fields.members.get.query({ dueDate, session }).catch(() => null),
  );

  return (
    <Suspense
      fallback={
        <div class="h-[180px] mx-auto items-center flex justify-center">
          <Loader />
        </div>
      }
    >
      <ul class="flex justify-evenly">
        <For each={members()}>
          {(member, memberIndex) => (
            <li class="w-[1in] overflow-hidden">
              <figure>
                <img
                  src={`${import.meta.env.BASE_URL}/${member.img}`}
                  alt={member.firstname + " " + member.lastname}
                  class="block w-100 h-[1.2in] object-cover"
                />
                <figcaption class="text-center">
                  <p>
                    <strong>
                      {member.firstname} {member.lastname}
                    </strong>
                  </p>
                  <p class="text-sm mt-[-5px]">{member.role}</p>

                  <div class="flex w-4/5 mx-auto relative justify-evenly">
                    <Editable
                      initialValue={member.disponibility.lastWeek.toString()}
                      onEdit={async (v) => {
                        await client.fields.members.disponibilities.edit.mutate(
                          {
                            session,
                            dueDate,
                            selected: "lastWeek",
                            memberIndex: memberIndex(),
                            disponibility: parseInt(v),
                          },
                        );
                        refetch();
                      }}
                    >
                      <span
                        class={`material-symbols-outlined block h-full aspect-square rounded-full bg-red ${
                          colors[member.disponibility.lastWeek - 1]
                        }`}
                      >
                        schedule
                      </span>
                    </Editable>

                    <span>|</span>

                    <Editable
                      initialValue={member.disponibility.nextWeek.toString()}
                      onEdit={async (v) => {
                        await client.fields.members.disponibilities.edit.mutate(
                          {
                            session,
                            dueDate,
                            selected: "nextWeek",
                            memberIndex: memberIndex(),
                            disponibility: parseInt(v),
                          },
                        );
                        refetch();
                      }}
                    >
                      <span
                        class={`material-symbols-outlined block h-full aspect-square rounded-full bg-red ${
                          colors[member.disponibility.nextWeek - 1]
                        }`}
                      >
                        schedule
                      </span>
                    </Editable>
                  </div>
                </figcaption>
              </figure>
            </li>
          )}
        </For>
      </ul>
    </Suspense>
  );
};

export default Members;
