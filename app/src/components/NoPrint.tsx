import { Component, JSX } from "solid-js";

const NoPrint: Component<{ children: JSX.Element; class?: string }> = (
  props
) => {
  return (
    <div class={`block print:hidden ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
};

export default NoPrint;
