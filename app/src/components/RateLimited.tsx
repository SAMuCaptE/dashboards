import { Component, createSignal, onCleanup } from "solid-js";
import { rateLimited } from "../client";
import Loader from "./Loader";

const RateLimited: Component = () => {
  const [delay, setDelay] = createSignal<number>(60);

  const interval = setInterval(
    () =>
      setDelay(
        Math.round(
          (rateLimited().getTime() + 60_000 - new Date().getTime()) / 1000,
        ),
      ),
    1000,
  );

  onCleanup(() => clearInterval(interval));

  return (
    <div class="flex h-[80vh] items-center justify-center flex-col">
      <h1 class="text-xl font-bold pb-5">Débit maximal atteint</h1>
      <Loader size={50} />
      <p class="text-lg pt-5">
        Retour dans <span class="font-bold">{delay()}</span> secondes
      </p>
    </div>
  );
};

export default RateLimited;
