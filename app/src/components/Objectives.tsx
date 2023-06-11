import { Component, For } from "solid-js";

import { fields } from "../stores/fields";

const Objectives: Component = () => {
  return (
    <div>
      <div>
        <p>Ordre du jour</p>
        <p>Plan technique</p>
        <p>Objectifs du sprint</p>
        <p>Objectifs de la session</p>
      </div>
      <div>
        <ol>{/* <For each={fields().}></For> */}</ol>
      </div>
    </div>
  );
  //   return <table class="objectives">
  //   <thead>
  //     <tr>
  //       <th>Ordre du jour</th>
  //       <th>Plan technique</th>
  //       <th>Objectifs du sprint</th>
  //       <th>Objectifs de la session</th>
  //     </tr>
  //   </thead>
  //   <tbody>
  //     <tr>
  //       <td width="{{meeting.agenda.width}}">
  //         <ol
  //           style="--columnCount: {{meeting.agenda.columnCount}}"
  //           t="meeting.agenda.items.[]"
  //           class="agenda"
  //         >
  //           <li>{{value}}</li>
  //         </ol>
  //       </td>
  //       <td width="{{meeting.technical.width}}">
  //         <ol
  //           style="--columnCount: {{meeting.technical.columnCount}}"
  //           t="meeting.technical.items.[]"
  //           class="agenda"
  //         >
  //           <li>{{value}}</li>
  //         </ol>
  //       </td>
  //       <td width="auto">{{objective}}</td>
  //       <td width="auto">{{[session].objective}}</td>
  //     </tr>
  //   </tbody>
  // </table>;
};

export default Objectives;
