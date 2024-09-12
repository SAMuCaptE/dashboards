import { Component, JSX } from "solid-js";

type EditableProps = {
  class?: string;
  children: JSX.Element;
  initialValue?: string;
  complexEdit?: boolean;
  onEdit?: (value: string) => void | Promise<void>;
  onDelete?: () => Promise<void>;
};

const Editable: Component<EditableProps> = (props) => {
  const edit = async (e: Event) => {
    if (props.onEdit || props.complexEdit) {
      e.stopPropagation();
      e.preventDefault();

      if (props.complexEdit) {
        await props.onEdit?.("");
        return;
      }

      const value = window.prompt(
        "Saisir la nouvelle valeur",
        props.initialValue,
      );
      if (value) {
        await props.onEdit?.(value);
      }
    }
  };

  return (
    <div
      onclick={edit}
      class={`relative group hover:border-4 border-black ${props.onEdit ? "hover:cursor-pointer" : ""}  ${
        props.class ?? ""
      }`}
    >
      {props.children}
      {props.onDelete && (
        <div class="hidden group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-white border-2 border-black z-10 rounded-sm">
          <button
            onclick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              await props.onDelete!();
            }}
          >
            <span class="material-symbols-outlined ">delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Editable;
