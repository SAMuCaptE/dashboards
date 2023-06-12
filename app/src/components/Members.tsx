import { Component, For } from "solid-js";
import { Fields } from "../stores/fields";

const colors = [
  "bg-lime-200",
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-600",
  "bg-red-600",
];

const Members: Component<{ data: Fields }> = (props) => {
  return (
    <ul class="flex justify-evenly">
      <For each={props.data.members}>
        {(member) => (
          <li class="w-[1in] overflow-hidden">
            <figure>
              <img
                src={`/assets/${member.img}`}
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
                  <span
                    class={`material-symbols-outlined block h-4/5 aspect-square rounded-full bg-red ${
                      colors[member.disponibility.lastWeek - 1]
                    }`}
                  >
                    schedule
                  </span>
                  <span>|</span>
                  <span
                    class={`material-symbols-outlined block h-4/5 aspect-square rounded-full bg-red ${
                      colors[member.disponibility.nextWeek - 1]
                    }`}
                  >
                    schedule
                  </span>
                </div>
              </figcaption>
            </figure>
          </li>
        )}
      </For>
    </ul>
  );
};

export default Members;
