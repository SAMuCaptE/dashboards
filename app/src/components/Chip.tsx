import { Component, JSX } from "solid-js";

type ChipProps = {
  label: string | JSX.Element;
  color: string;
  class?: string;
};

export const Chip: Component<ChipProps> = (props) => {
  return (
    <div
      class={"rounded-full w-fit px-2 z-10 " + props.class ?? ""}
      style={{ background: props.color }}
    >
      <p class="uppercase font-black text-white text-center text-[0.65rem]">
        {props.label}
      </p>
    </div>
  );
};
