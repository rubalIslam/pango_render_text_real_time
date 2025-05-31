import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import WebSocketClient from './WebSocketClient';
import FrameWithDragText from './FrameWithDragText';
//import FrameWithDragText from './FramePlayerWithText'
//import FrameWithDragText2 from './ui_old/FrameWithDragText2';

function App() {
  const ws = useRef(null);
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:9002');

    ws.current.onopen = () => {
      setStatus('Connected');
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.current.onclose = () => {
      setStatus('Disconnected');
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const sendRenderRequest = (data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      console.log("sending message to cpp: ",JSON.stringify(data))
    } else {
      console.warn('WebSocket not open');
    }
  };

  return (
    <>
      {/*<FrameWithDragText sendRenderRequest={sendRenderRequest} />*/}
      <FrameWithDragText sendRenderRequest={sendRenderRequest}/>
      <WebSocketClient status={status} messages={messages} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
