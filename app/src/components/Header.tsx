import { Component } from "solid-js";
import * as params from "../stores/params";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });

const Header: Component = () => {
  const startDate = () =>
    new Date(params.dueDate().getTime() - 6 * 24 * 3600 * 1000);

  return (
    <header class="h-[1in] w-11/12 mx-auto my-0 grid grid-cols-[2fr_1fr] items-center relative">
      <hgroup>
        <h1 class="text-4xl font-bold">Tableau de bord</h1>
        <h3 class="text-xl font-semibold">
          Période du <strong>{dateFormatter.format(startDate())}</strong> au{" "}
          <strong>{dateFormatter.format(params.dueDate())}</strong>
        </h3>
      </hgroup>

      <figure>
        <img class="object-contain block h-[1in]" src="/assets/logo.jpg" />
      </figure>
    </header>
  );
};

export default Header;
