import React, { useRef, useEffect, useState } from 'react';

export default function FrameCanvas() {
  const canvasRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const framesRef = useRef([]);
  const frameIndexRef = useRef(0);
  const timeoutIdRef = useRef(null);
  const socketRef = useRef(null);

  const socket = new WebSocket('ws://localhost:PORT');
    socket.onopen = () => {
    socket.send('start');  // send on button click
    };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    socketRef.current = new WebSocket('ws://localhost:8081/ws');
    socketRef.current.binaryType = 'arraybuffer';

    socketRef.current.onopen = () => console.log('WebSocket connected');
    socketRef.current.onerror = (e) => console.error('WebSocket error', e);
    socketRef.current.onclose = () => console.log('WebSocket closed');

    socketRef.current.onmessage = (event) => {
      const data = new Uint8ClampedArray(event.data);
      if (data.length === 640 * 480 * 4) {
        framesRef.current.push(new Uint8ClampedArray(data));
      }
    };

    return () => {
      socketRef.current.close();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function drawNextFrame() {
      if (!isPlaying) return; // stop condition

      if (frameIndexRef.current >= framesRef.current.length) {
        setIsPlaying(false);
        frameIndexRef.current = 0;
        return;
      }

      const frame = framesRef.current[frameIndexRef.current];
      const imageData = new ImageData(frame, 640, 480);
      ctx.putImageData(imageData, 0, 0);

      frameIndexRef.current++;
      timeoutIdRef.current = setTimeout(drawNextFrame, 33);
    }

    drawNextFrame();

    // Cleanup on stop
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <div>
      <button onClick={() => {
        frameIndexRef.current = 0;
        setIsPlaying(true);
      }}>
        Start Animation
      </button>
      <button onClick={() => setIsPlaying(false)}>
        Stop
      </button>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black', width: '640px', height: '480px' }}
        width={640}
        height={480}
      />
    </div>
  );
}
