import React, { useState, useRef, useEffect } from 'react';

const AutoWidthInput = ({ initialText = "Default Text", ...props }) => {
  const [text, setText] = useState(initialText);
  const [inputWidth, setInputWidth] = useState(0);
  const spanRef = useRef(null);

  useEffect(() => {
    if (spanRef.current) {
      setInputWidth(spanRef.current.offsetWidth + 20); // Add padding
    }
  }, [text]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: inputWidth,
          padding: '8px 12px',
          background: '#f5f5f5',
          border: '1px solid #aaa',
          cursor: 'move',
          userSelect: 'none',
          marginRight: 20,
        }}
        {...props}
      />
      {/* Hidden span for measuring text width */}
      <span
        ref={spanRef}
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          visibility: 'hidden',
          whiteSpace: 'pre',
          fontSize: '16px',
          fontFamily: 'sans-serif',
          padding: '8px 12px',
        }}
      >
        {text || ' '}
      </span>
    </div>
  );
};

export default AutoWidthInput;
