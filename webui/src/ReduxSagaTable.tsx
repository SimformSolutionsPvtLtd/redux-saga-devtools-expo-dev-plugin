import {
  SisternodeOutlined,
  SubnodeOutlined,
} from "@ant-design/icons";
import ReactJsonView from "@microlink/react-json-view";
import { App, Button, Typography, Flex, Table } from "antd";
import React from "react";

import { usePluginStore } from "./usePluginStore";
import { useTableData } from "./useTableData";

export const ReduxSagaTable = () => {
  const { message } = App.useApp();
  const { entries, ready } = usePluginStore((error: unknown) => {
    message.error(String(error));
  });

  const { rows } = useTableData({
    entries,
  });

  return (
    <>
      <Table
        loading={!ready}
        bordered
        size="middle"
        style={{ width: "100%" }}
        dataSource={rows}
        pagination={false}
        expandable={{
          rowExpandable(record) {
            return (record.children || []).length > 0;
          },
          expandedRowRender(record) {
            if ((record.children || []).length <= 0) return null;
            return (
              <Table
                loading={false}
                bordered
                size="middle"
                style={{ width: "100%" }}
                dataSource={record.children}
                pagination={false}
                columns={[
                  { title: "Key", dataIndex: "key", key: "key" },
                  {
                    title: "Name",
                    dataIndex: "name",
                    key: "name",
                    render: (_, { status, name, depth, isLoser }) => {
                      return (
                        <Flex
                          vertical={false}
                          justify="flex-start"
                          align="center"
                          gap="small"
                          wrap="wrap"
                        >
                          {status}
                          <Typography.Text delete={isLoser}>
                            {name}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {`(depth: ${depth})`}
                          </Typography.Text>
                        </Flex>
                      );
                    },
                  },
                  {
                    title: "Description",
                    dataIndex: "description",
                    key: "description",
                  },
                  {
                    title: "In",
                    dataIndex: "in",
                    key: "in",
                    render: (_, { in: inSrc }) => {
                      return (
                        <ReactJsonView
                          src={inSrc}
                          iconStyle="circle"
                          collapsed
                          enableClipboard
                        />
                      );
                    },
                  },
                  {
                    title: "Out",
                    dataIndex: "out",
                    key: "out",
                    render: (_, { out: outSrc }) => {
                      return (
                        <ReactJsonView
                          src={outSrc}
                          iconStyle="circle"
                          collapsed
                          enableClipboard
                        />
                      );
                    },
                  },
                  {
                    title: "Duration",
                    dataIndex: "time",
                    key: "time",
                  },
                ]}
              />
            );
          },
          expandIcon: ({ expanded, expandable, onExpand, record }) =>
            expandable ? (
              <Button
                icon={expanded ? <SisternodeOutlined /> : <SubnodeOutlined />}
                onClick={(event) => onExpand(record, event)}
                type="text"
              />
            ) : null,
        }}
        columns={[
          { title: "Type", dataIndex: "type", key: "type" },
          {
            title: "Title",
            dataIndex: "effectTitle",
            key: "effectTitle",
          },
          {
            title: "Duration",
            dataIndex: "duration",
            key: "duration",
          },
        ]}
        title={() => (
          <Flex align="center" justify="center" gap="0.5em">
            <h1>Redux Saga Devtools</h1>
          </Flex>
        )}
      />
    </>
  );
};
