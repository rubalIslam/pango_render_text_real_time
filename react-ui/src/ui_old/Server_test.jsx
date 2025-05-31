import React, { useEffect } from "react";

export default function Server_test() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8081/ws");

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    ws.onmessage = (event) => {
      console.log("Message received:", event.data);
      // Here you will handle frame data from server
    };

    return () => {
      ws.close();
    };
  }, []);

  return <div>FrameCanvas running, see console for WebSocket status</div>;
}
