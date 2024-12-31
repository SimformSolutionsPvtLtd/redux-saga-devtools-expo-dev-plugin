import { App } from "antd";

import { ReduxSagaTable } from "./ReduxSagaTable";

export const DevToolsApp = () => {
  return (
    <App
      style={{
        width: "100%",
        height: "100%",
        padding: "0.75em",
        overflowY: "scroll",
      }}
    >
      <ReduxSagaTable />
    </App>
  );
};
