import { Component } from "solid-js";
import * as params from "../stores/params";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", { dateStyle: "long" });

const Header: Component = () => {
  return (
    <header class="h-[1in] w-[95%] mt-2 mx-auto my-0 grid grid-cols-[2fr_1fr] items-center relative">
      <hgroup>
        <h1 class="text-4xl font-bold">Tableau de bord</h1>
        <h3 class="text-xl font-semibold">
          Période du <strong>{dateFormatter.format(params.startDate())}</strong>{" "}
          au <strong>{dateFormatter.format(params.endDate())}</strong>
        </h3>
      </hgroup>

      <figure>
        <img class="object-contain block h-[1in]" src="/assets/logo.png" />
      </figure>
    </header>
  );
};

export default Header;
