import { Component, JSX } from "solid-js";
import { Fields } from "../resources/fields";

const Page: Component<{ children: JSX.Element; data: Fields }> = (props) => {
  return (
    <main class="w-[8.5in] h-[11in] border-black border-2 mx-auto block my-5 relative">
      {props.children}
      <footer class="opacity-80 absolute bottom-1 left-1/2 -translate-x-1/2">
        <p class="text-sm">
          <strong>SAMuCaptE</strong> - {props.data.meeting.date}
        </p>
      </footer>
    </main>
  );
};

export default Page;
