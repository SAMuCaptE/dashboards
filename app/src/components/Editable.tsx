import { Component, JSX } from "solid-js";

type EditableProps = {
  children: JSX.Element;
  initialValue?: string;
  onEdit: (value: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

const Editable: Component<EditableProps> = (props) => {
  const edit = async () => {
    const value = window.prompt(
      "Saisir la nouvelle valeur",
      props.initialValue
    );
    if (value) {
      await props.onEdit(value);
    }
  };

  return (
    <div onclick={edit} class="relative group hover:cursor-pointer">
      {props.children}
      <div class="hidden group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-white border-2 border-black z-10 rounded-sm">
        <button
          onclick={async (e) => {
            e.stopPropagation();
            await props.onDelete();
          }}
        >
          <span class="material-symbols-outlined ">delete</span>
        </button>
      </div>
    </div>
  );
};

export default Editable;
