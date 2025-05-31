import React, { useState, useEffect, useRef } from 'react';

export default function WebSocketClient() {
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    // Open WebSocket connection
    ws.current = new WebSocket('ws://localhost:9002');

    ws.current.onopen = () => {
      setStatus('Connected');
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
      setMessages(prev => [...prev, event.data]);
    };

    ws.current.onclose = () => {
      setStatus('Disconnected');
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    // Cleanup on unmount
    return () => {
      ws.current.close();
    };
  }, []);

  // Function to send a render request to server
  const sendRenderRequest = (data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(data)
    //   const request = {
    //     text: "Hello from React",
    //     width: 1280,
    //     height: 720,
    //     fps: 30,
    //     duration: 10,
    //     thread_count: 4
    //   };
    //   ws.current.send(JSON.stringify(request));
    }
  };

  return (
    <div>
      <h2>WebSocket Status: {status}</h2>
      <button onClick={sendRenderRequest} disabled={status !== 'Connected'}>
        Start Render
      </button>
      <h3>Messages from server:</h3>
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  );
}
