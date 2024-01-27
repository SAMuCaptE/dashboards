import { Component } from "solid-js";
import NoPrint from "./NoPrint";

type LoaderProps = {
  size?: number;
};

const Loader: Component<LoaderProps> = (props) => {
  return (
    <NoPrint>
      <span
        class="loader"
        style={{
          width: `${props.size ?? 36}px`,
          height: `${props.size ?? 36}px`,
        }}
      />
    </NoPrint>
  );
};

export default Loader;
