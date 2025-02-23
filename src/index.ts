export let createSagaMonitor: typeof import("./sagaMonitor").default;

// @ts-ignore process.env.NODE_ENV is defined by metro transform plugins
if (process.env.NODE_ENV !== "production") {
  createSagaMonitor = require("./sagaMonitor").default;
} else {
  createSagaMonitor = () => {
    return {};
  };
}
