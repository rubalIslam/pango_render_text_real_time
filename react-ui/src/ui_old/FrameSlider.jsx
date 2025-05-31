import React, { useState, useEffect } from 'react';

function FrameSlider({ frameCount, frameUrlPrefix }) {
    const [frameIndex, setFrameIndex] = useState(0);

    const handleChange = (e) => {
        setFrameIndex(Number(e.target.value));
    };

    const paddedIndex = frameIndex.toString().padStart(3, '0');

    return (
        <div>

            <div style={{ marginTop: 10, backgroundColor: "grey" }}>
                <img
                    src={`${frameUrlPrefix}/frame_${paddedIndex}.png`}
                    alt={`Frame ${frameIndex}`}
                    style={{ maxWidth: '100%', height: 'auto' }}
                    draggable={false}
                />
            </div>
            <div>Frame: {frameIndex + 1} / {frameCount}</div>
            <input
                type="range"
                min="0"
                max={frameCount - 1}
                value={frameIndex}
                onChange={handleChange}
                style={{ width: '100%' }}
            />
        </div>
    );
}

export default FrameSlider;
