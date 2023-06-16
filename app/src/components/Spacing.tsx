import { Component } from "solid-js";

const Spacing: Component<{ size?: number }> = (props) => {
  return <div class={`mt-${props.size ?? 10}`} />;
};

export default Spacing;
