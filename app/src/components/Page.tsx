import { Component, JSX } from "solid-js";

const Page: Component<{ children: JSX.Element }> = (props) => {
  return <main class="w-[8.5in] h-[11in] border-black border-2 mx-auto block my-5">{props.children}</main>;
};

export default Page;
