import React, { useState, useEffect, useRef } from 'react';

export default function WebSocketClient({ status, messages }) {
  return (
    <div>
      <h2>WebSocket Status: {status}</h2>
      <h3>Messages from server:</h3>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}