import { Component, JSX } from "solid-js";

const Columns: Component<{ children: JSX.Element; cols?: number }> = (
  props
) => {
  return (
    <div class={`grid grid-cols-${props.cols ?? 2}`}>{props.children}</div>
  );
};

export default Columns;
