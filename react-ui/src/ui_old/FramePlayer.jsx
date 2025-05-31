import React, { useState, useEffect, useRef } from 'react';

const FramePlayer = ({ text = "Default Text", totalFrames = 300, fps = 30 }) => {
    const [frameIndex, setFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [textPos, setTextPos] = useState({ x: 100, y: 100 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const intervalRef = useRef(null);

    const getFrameUrl = (index) => {
        const padded = String(index).padStart(3, '0');
        return `http://localhost:8000/frames/frame_${padded}.png`;
    };

    const handleMouseDown = (e) => {
        setDragging(true);
        setDragOffset({
            x: e.clientX - textPos.x,
            y: e.clientY - textPos.y,
        });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        setTextPos({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
        });
    };

    const handleMouseUp = () => setDragging(false);
    
    const startPlayback = () => {
        if (intervalRef.current) return;

        intervalRef.current = setInterval(() => {
            setFrameIndex((prev) => {
                if (prev + 1 >= totalFrames) {
                    stopPlayback();
                    return 0;
                }
                return prev + 1;
            });
        }, 1000 / fps);

        setIsPlaying(true);
    };

    const stopPlayback = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPlaying(false);
    };

    const togglePlayback = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback();
        }
    };

    useEffect(() => {
        return () => stopPlayback(); // Cleanup on unmount
    }, []);

    return (
        <div>
            <div style={{ marginTop: 10, backgroundColor: "grey" }}>
            <img
                src={getFrameUrl(frameIndex)}
                alt={`Frame ${frameIndex}`}
                style={{ width: '100%', maxWidth: '100%', height: 'auto' }}
            />
            </div>

            <input
                type="range"
                min="0"
                max={totalFrames - 1}
                value={frameIndex}
                onChange={(e) => setFrameIndex(Number(e.target.value))}
                style={{ width: '100%', marginTop: '10px' }}
            />

            <button onClick={togglePlayback} style={{ marginTop: '10px' }}>
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
};

export default FramePlayer;
