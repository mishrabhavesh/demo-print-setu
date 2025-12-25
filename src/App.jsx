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
import { Buf } from "./BufferPoly";

const { Header, Content } = Layout;
const { TextArea } = Input;
const { Title } = Typography;
const { Option } = Select;

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [printing, setPrinting] = useState(false);

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

// Convert file to base64 (raw bytes)
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file); // read raw bytes
    reader.onload = () => {
      const buffer = Buf.from(reader.result); // FIXED: use Buffer.from
      resolve(buffer.toString("base64")); // send as base64
    };
    reader.onerror = reject;
  });
};

// Convert text to base64 UTF-8
const textToBase64 = (text) => {
  return Buf.from(text, "utf-8").toString("base64");
};

const handlePrint = async () => {
  if (!file && !text.trim()) {
    message.warning("Please upload a file or enter text");
    return;
  }

  try {
    setPrinting(true);
    let base64Data = "";

    if (file) {
      base64Data = await fileToBase64(file);
    } else if (text.trim()) {
      base64Data = textToBase64(text);
    }

    console.log("Sending base64 to backend, length:", base64Data.length);

    // send base64 string to backend for printing
    const result = await print(
      connectedPrinter.id,
      base64Data,
      {
        copies: 1,
        type: file ? "file" : "text",
      }
    );

    if (result.success) {
      message.success(`Print job submitted! Job ID: ${result.jobId}`);
      setFile(null);
      setText("");
    } else {
      message.error(result.message || "Print job failed");
    }
  } catch (error) {
    message.error("Print error: " + error.message);
    console.error("Print error:", error);
  } finally {
    setPrinting(false);
  }
};

  return (
    <Layout style={{ minHeight: "100vh", width: "100vw" }}>
      <Header style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={3} style={{ margin: 0 }}>Print Demo</Title>
          <Tag color={isConnected ? "green" : "red"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Tag>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <Card style={{ maxWidth: 600, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>

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
              <div>
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
                      description={`Connected to: ${printers.find(p => p.id === connectedPrinter)?.name}`}
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
              </div>
            )}

            <Upload
              beforeUpload={(file) => {
                if (file.type.startsWith("video/")) {
                  message.error("Video files are not allowed!");
                  return false;
                }
                setFile(file);
                setText("");
                message.success(`${file.name} selected`);
                return false; // prevent auto upload
              }}
              maxCount={1}
              onRemove={() => setFile(null)}
              fileList={file ? [file] : []}
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>

            <TextArea
              rows={4}
              placeholder="Type text to print... (or upload a file above)"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim()) setFile(null);
              }}
              disabled={!!file}
            />

            <Button
              type="primary"
              icon={<PrinterOutlined />}
              block
              size="large"
              onClick={handlePrint}
              disabled={!connectedPrinter || (!file && !text.trim())}
              loading={printing}
            >
              {printing ? "Printing..." : "Print"}
            </Button>

          </Space>
        </Card>
      </Content>
    </Layout>
  );
}

export default App;
