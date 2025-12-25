// usePrinter.js
import { useState, useEffect, useCallback } from "react";
import { PrinterService } from 'print-setu';

const printer = new PrinterService({ url: 'ws://127.0.0.1:8899', apiKey: "123456" });

export function usePrinter() {
  const [printers, setPrinters] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [connectedPrinter, setConnectedPrinter] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    printer
      .connect()
      .then(() => setIsConnected(true))
      .catch((err) => {
        setError(err.message);
        setIsConnected(false);
      });

    // Subscribe to printer discovery results
    const unsubscribePrintersResult = printer.on(
      "USB_PRINTERS_RESULT",
      (data) => {
        if (data.success && data.data) {
          setPrinters(data.data);
          setIsScanning(false);
        } else {
          setError(data.error || "Failed to get printers");
          setIsScanning(false);
        }
      }
    );

    // Subscribe to individual printer discovered events
    const unsubscribePrinterDiscovered = printer.on(
      "PRINTER_DISCOVERED",
      (data) => {
        if (data.data) {
          setPrinters((prev) => {
            const exists = prev.find((p) => p.id === data.data.id);
            if (exists) return prev;
            return [...prev, data.data];
          });
        }
      }
    );

    // Subscribe to connection results
    const unsubscribeConnected = printer.on(
      "PRINTER_CONNECTED",
      (data) => {
        if (!data.success) {
          setError(data.error || "Failed to connect to printer");
        } else {
          setError(null);
        }
      }
    );

    // Subscribe to disconnection results
    const unsubscribeDisconnected = printer.on(
      "PRINTER_DISCONNECTED",
      (data) => {
        if (!data.success) {
          setError(data.error || "Failed to disconnect from printer");
        } else {
          setError(null);
        }
      }
    );

    // Subscribe to print results
    const unsubscribePrintResult = printer.on(
      "PRINT_RESULT",
      (data) => {
        if (!data.success) {
          setError(data.error || "Failed to print");
        } else {
          setError(null);
        }
      }
    );

    // Subscribe to errors
    const unsubscribeError = printer.on("ERROR", (data) => {
      setError(data.error || "An error occurred");
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribePrintersResult();
      unsubscribePrinterDiscovered();
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribePrintResult();
      unsubscribeError();
    };
  }, []);

  const scanPrinters = useCallback(async () => {
    try {
      setIsScanning(true);
      setError(null);

      return new Promise((resolve, reject) => {
        const unsubscribe = printer.on("USB_PRINTERS_RESULT", (data) => {
          unsubscribe();
          console.log(data, 'data');

          setIsScanning(false);
          if (data.payload?.success) {
            setPrinters(data.payload.data || []);
            resolve(data.payload.data);
          } else {
            setError(data.error || "Failed to scan printers");
            reject(data);
          }
        });

        printer.scanPrinters().catch((err) => {
          setIsScanning(false);
          setError(err.message);
          reject(err);
        });
      });
    } catch (err) {
      setError(err.message);
      setIsScanning(false);
      throw err;
    }
  }, []);

  const connectPrinter = useCallback(async (printerId: string) => {
    console.log(printerId, 'printerId');
    setIsConnecting(true);
    try {
      setError(null);

      return new Promise((resolve, reject) => {
        const unsubscribe = printer.on("PRINTER_CONNECTED", (data) => {
          unsubscribe();
          if (data.payload.success) {
            setConnectedPrinter(data.payload.data)
            setIsConnecting(false);
            resolve(data.payload.data);
          } else {
            setError(data.error || "Failed to connect to printer");
            reject(data); 
          }
        });

        return printer.connectPrinter(printerId).catch((err) => {
          setError(err.message);
          reject(err);
        });
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const disconnectPrinter = useCallback(async () => {
    setConnectedPrinter(null);
    setPrinters([]);
    setError(null);
  }, []);

  const print = useCallback(async (printerId, base64Data) => {
    try {
      setError(null);

      return new Promise((resolve, reject) => {
        const unsubscribe = printer.on("PRINT_RESULT", (data) => {
          unsubscribe();          
          if (data.payload) {
            resolve(data);
          } else {
            setError(data.error || "Failed to print");
            reject(data);
          }
        });

        printer.print(printerId, base64Data).catch((err) => {
          setError(err.message);
          reject(err);
        });
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    printers,
    isScanning,
    isConnected,
    error,
    scanPrinters,
    connectPrinter,
    disconnectPrinter,
    connectedPrinter,
    print,
    isConnecting
  };
}
