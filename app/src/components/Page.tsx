import { Fields } from "dashboards-server";
import { Component, JSX } from "solid-js";

const Page: Component<{ children: JSX.Element; data: Fields }> = (props) => {
  return (
    <main class="w-[8.5in] h-[11in] border-black border-2 mx-auto block my-5 relative">
      {props.children}
      <footer class="opacity-80 absolute bottom-3 left-1/2 -translate-x-1/2">
        <p class="text-sm">
          <strong>SAUM</strong> - {props.data.meeting.date}
        </p>
      </footer>
    </main>
  );
};

export default Page;
