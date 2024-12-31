import { App } from "antd";
import { useDevToolsPluginClient, type EventSubscription } from "expo/devtools";
import { useEffect, useState } from "react";

export function usePluginStore(onError: (error: unknown) => void) {
  const client = useDevToolsPluginClient("redux-saga-devtools-expo-dev-plugin");

  const { notification } = App.useApp();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let interval = setInterval(() => {
      if (client?.isConnected()) {
        if (interval != null) {
          clearInterval(interval);
          interval = null;
        }
        setConnected(true);
      }
    }, 1000);
    return () => {
      if (interval != null) {
        clearInterval(interval);
        interval = null;
      }
    };
  }, [client]);

  const [entries, setEntries] = useState<readonly any[]>([]);

  useEffect(() => {
    const subscriptions: EventSubscription[] = [];

    try {
      subscriptions.push(
        client?.addMessageListener("saga.task.complete", (params) => {
          setEntries((entries) => [...entries, params]);
        }),
      );
    } catch (e) {
      onError(e);
    }

    try {
      subscriptions.push(
        client?.addMessageListener("saga.task.list", (params) => {
          setEntries((entries) => [...entries, ...params]);
        }),
      );
    } catch (e) {
      onError(e);
    }

    subscriptions.push(
      client?.addMessageListener("error", ({ error }: { error: unknown }) => {
        onError(error);
      }),
    );

    return () => {
      for (const subscription of subscriptions) {
        try {
          subscription?.remove();
        } catch (e) {
          onError(e);
        }
      }
    };
  }, [client]);

  return {
    entries,
    ready: connected,
  };
}
