import React, { useRef, useEffect, useState } from 'react';

export default function FrameCanvas() {
  const canvasRef = useRef();
  const [playing, setPlaying] = useState(false);  // Track play state

  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const socket = new WebSocket('ws://localhost:8081/ws');
    socket.binaryType = 'arraybuffer';

    socket.onopen = () => console.log('WebSocket connected');
    socket.onerror = (e) => console.error('WebSocket error', e);
    socket.onclose = () => console.log('WebSocket closed');

    socket.onmessage = (event) => {
      const data = new Uint8ClampedArray(event.data);

      // Check data size and log error if mismatch
      if (data.length !== 640 * 480 * 4) {
        console.error('Unexpected frame size:', data.length);
        return;
      }

      // Count non-transparent pixels (optional, for debugging)
      let nonZeroCount = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0 || data[i + 3] !== 0) {
          nonZeroCount++;
        }
      }
      console.log('Non-transparent pixels:', nonZeroCount);

      // Create and draw ImageData on canvas
      const imageData = new ImageData(data, 640, 480);
      ctx.putImageData(imageData, 0, 0);
    };

    return () => socket.close();
  }, [playing]);

  return (
    <div>
      <button onClick={() => setPlaying(true)}>Play</button>
      <button onClick={() => setPlaying(false)}>Stop</button>

      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', width: '640px', height: '480px' }}
        width={640}
        height={480}
      />
    </div>
  );
}
