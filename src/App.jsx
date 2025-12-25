import { useState } from "react";
import {
  Layout,
  Card,
  Upload,
  Input,
  Button,
  Typography,
  Space,
  message,
  Select,
  Alert,
  Tag,
} from "antd";
import {
  UploadOutlined,
  PrinterOutlined,
  ReloadOutlined,
  LinkOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";

import { usePrinter } from "./usePrinter";
import { buildPrintData } from "./print/printService";

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [selectedPrinter, setSelectedPrinter] = useState(null);

  const {
    printers,
    isScanning,
    isConnected,
    scanPrinters,
    connectPrinter,
    disconnectPrinter,
    connectedPrinter,
    print,
    isConnecting,
  } = usePrinter();

  const handlePrint = async () => {
    if (!connectedPrinter) {
      message.error("Printer not connected");
      return;
    }

    if (!file && !text.trim()) {
      message.warning("Please upload a file or enter text");
      return;
    }

    try {
      const base64EscPos = await buildPrintData({
        text: text.trim() ? text : undefined,
        file: file ?? undefined,
      });

      const result = await print(connectedPrinter.id, base64EscPos);

      if (result.success) {
        message.success("Print job submitted successfully");
        setFile(null);
        setText("");
      } else {
        message.error(result.message || "Print job failed");
      }
    } catch (err) {
      console.error("Print error:", err);
      message.error(err.message || "Print failed");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", width: "100vw" }}>
      <Header style={{ background: "#fff", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Print Demo
          </Title>
          <Tag color={isConnected ? "green" : "red"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Tag>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <Card style={{ maxWidth: 600, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Alert
              message="🖨️ Setup Instructions"
              description={
                <div style={{ lineHeight: "1.8" }}>
                  <p style={{ marginBottom: 8, fontWeight: 500 }}>
                    Before using this demo, please complete the following steps:
                  </p>
                  <ol style={{ marginLeft: 16, marginBottom: 0 }}>
                    <li>
                      Download the Windows desktop app from{" "}
                      <a
                        href="https://drive.google.com/drive/u/1/folders/1odBnoRzXz_Q4cKpnvWNxoPfzxcjZkPeq"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500 }}
                      >
                        Google Drive
                      </a>
                    </li>
                    <li>Run the desktop app on your Windows machine</li>
                    <li>
                      Ensure your printer is <strong>plugged in</strong> and
                      turned on
                    </li>
                    <li>
                      Once the desktop app is running, this web app will connect
                      automatically
                    </li>
                  </ol>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 8 }}
            />

            {!isConnected && (
              <Alert
                message="WebSocket Disconnected"
                description="Attempting to connect to printer service..."
                type="warning"
                showIcon
              />
            )}

            <Button
              onClick={scanPrinters}
              icon={<ReloadOutlined />}
              loading={isScanning}
              block
            >
              {isScanning ? "Scanning..." : "Scan for Printers"}
            </Button>

            {printers.length > 0 && (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Select
                  placeholder="Select a printer"
                  style={{ width: "100%" }}
                  value={selectedPrinter}
                  onChange={setSelectedPrinter}
                >
                  {printers.map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.name} - {p.status}
                    </Option>
                  ))}
                </Select>

                {!connectedPrinter && selectedPrinter && (
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => connectPrinter(selectedPrinter)}
                    loading={isConnecting}
                    block
                  >
                    Connect to Printer
                  </Button>
                )}

                {connectedPrinter && (
                  <Alert
                    message="Printer Connected"
                    description={`Connected to: ${
                      printers.find((p) => p.id === connectedPrinter.id)?.name
                    }`}
                    type="success"
                    showIcon
                    action={
                      <Button
                        size="small"
                        danger
                        icon={<DisconnectOutlined />}
                        onClick={disconnectPrinter}
                        loading={isConnecting}
                      >
                        Disconnect
                      </Button>
                    }
                  />
                )}
              </Space>
            )}

            <Upload
              beforeUpload={(f) => {
                if (f.type.startsWith("video/")) {
                  message.error("Video files are not allowed");
                  return false;
                }
                setFile(f);
                setText("");
                message.success(`${f.name} selected`);
                return false;
              }}
              onRemove={() => setFile(null)}
              maxCount={1}
              fileList={file ? [file] : []}
            >
              <Button icon={<UploadOutlined />}>Upload Image / PDF</Button>
            </Upload>

            <TextArea
              rows={4}
              placeholder="Type text to print..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim()) setFile(null);
              }}
            />

            <Button
              type="primary"
              icon={<PrinterOutlined />}
              block
              size="large"
              onClick={handlePrint}
              disabled={!connectedPrinter || (!file && !text.trim())}
            >
              Print
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

export default App;