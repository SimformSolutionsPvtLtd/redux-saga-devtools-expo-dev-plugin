/* eslint-disable react-hooks/rules-of-hooks */
// Import all the hooks
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import { Reducer, useEffect, useReducer, useState } from "react";

const STATUS_MAP = {
  RESOLVED: <CheckCircleOutlined />,
  REJECTED: <ExclamationCircleOutlined />,
  CANCELLED: <LogoutOutlined />,
};

export type TableRow = {
  key: string;
  value: string;
  editedValue?: string;
  json: object | null;
};

function jsonStructure(str: unknown): object {
  if (typeof str !== "string") return {};
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result);
    return type === "[object Object]" || type === "[object Array]"
      ? result
      : {};
  } catch (err) {
    return {};
  }
}

export function useTableData({
  entries,
}: {
  entries: readonly {
    key: string;
    value: string | null;
  }[];
}) {
  const { message } = App.useApp();
  try {
    const [inProgressEdits, updateInProgressEdits] = useReducer<
      Reducer<
        Record<string, string | null>,
        Record<string, string | null> | "clear"
      >
    >((state, payload) => {
      if (payload === "clear") {
        return {};
      }
      return {
        ...state,
        ...payload,
      };
    }, {});

    const [rows, updateRows] = useState<TableRow[]>([]);

    useEffect(() => {
      updateRows(
        entries?.map((entry) => {
          return {
            type: entry.description || entry.triggerType,
            effectTitle: `${entry.children.length} Effect${entry.children.length === 1 ? "" : "s"}`,
            duration: `${entry.duration}ms`,
            children: entry.children
              .map((effect) => {
                const {
                  extra,
                  loser,
                  status,
                  name,
                  description,
                  duration,
                  depth,
                  result,
                } = effect;

                const isExtra = extra != null && extra !== undefined;

                return {
                  key: `effect-${effect.effectId}`,
                  depth,
                  isLoser: loser || status === "CANCELLED",
                  status: STATUS_MAP[status] || null,
                  name: name || "",
                  description: isExtra ? description || "" : "",
                  in: jsonStructure(JSON.stringify(isExtra ? extra : {})),
                  out: jsonStructure(JSON.stringify(isExtra ? result : {})),
                  time: `${duration}ms`,
                };
              })
              .sort(
                (a, b) =>
                  new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare(
                    a.key,
                    b.key
                  )
              ),
          };
        }) || [],
      );
    }, [entries, inProgressEdits]);

    return {
      rows,
      inProgressEdits,
      updateInProgressEdits,
    };
  } catch (err) {
    message.error(String(err));
    return {
      rows: [],
      inProgressEdits: {},
      updateInProgressEdits: () => {},
    };
  }
}
