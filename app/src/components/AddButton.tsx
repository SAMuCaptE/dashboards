import { Component } from "solid-js";
import NoPrint from "./NoPrint";

const AddButton: Component<{
  complexAdd?: boolean;
  onAdd: (value: string) => void | Promise<void>;
}> = (props) => {
  const handleClick = async () => {
    if (props.complexAdd) {
      await props.onAdd("");
      return;
    }

    const value = window.prompt("Saisir la nouvelle valeur");
    if (value) {
      await props.onAdd(value);
    }
  };

  return (
    <NoPrint class="absolute right-0">
      <button
        onclick={handleClick}
        class="rounded-full bg-white border-2 border-black h-[1.4em]"
      >
        <span class="text-[1.2em] material-symbols-outlined">add</span>
      </button>
    </NoPrint>
  );
};

export default AddButton;
