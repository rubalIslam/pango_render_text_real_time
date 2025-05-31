import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Draggable from 'react-draggable';

const FrameWithDragText = ({ totalFrames = 300, fps = 30, sendRenderRequest }) => {
    const [frameIndex, setFrameIndex] = useState(0);
    const [text, setText] = useState("Display Text");
    const [textPos, setTextPos] = useState({ x: 0, y: 100 });
    
    const [fontUrl, setFontUrl] = useState(null);
    const [fontName, setFontName] = useState("CustomFont");
    const [inputSizeVersion, setInputSizeVersion] = useState(0);
    const inputSizeVersionRef = useRef(0);


    useEffect(() => {
        inputSizeVersionRef.current = inputSizeVersion;
    }, [inputSizeVersion]);
    
    const [inputSize, setInputSize] = useState({ 
        text_width: 120, 
        text_height: 40,
        text_x: 100,
        text_y: 100
    });
    const inputSizeRef = useRef(inputSize);
    useEffect(() => {
        inputSizeRef.current = inputSize;
    }, [inputSize]);

    useEffect(() => {
        if (!fontUrl) return;

        const newFont = new FontFace(fontName, `url(${fontUrl})`);
        newFont.load().then((loaded) => {
            document.fonts.add(loaded);
            console.log('Font loaded:', fontName);
        }).catch((err) => {
            console.error('Font load failed:', err);
        });
    }, [fontUrl]);
/*
    useLayoutEffect(() => {
        console.log("inputSize changed:", inputSize);
        console.log("textPos:", textPos);
        console.log("text:", text);
        console.log("fontUrl:", fontUrl);
        if (!imgRef.current || !fontUrl) {
            console.log("imgRef.current not ready in useLayoutEffect, returning")   
            //return;
        }
        const imgBounds = imgRef.current.getBoundingClientRect();
        const { x, y } = textPos;

        if (
            x >= imgBounds.left &&
            y >= imgBounds.top &&
            x <= imgBounds.right &&
            y <= imgBounds.bottom
        ) {
            console.log("rendering data")
            const renderData = {
                x: Math.floor(x - imgBounds.left),
                y: Math.floor(y - imgBounds.top),
                text,
                width: 1280,
                height: 720,
                duration: 10,
                text_width: (1280 / 1920) * inputSize.text_width,
                text_height: (720 / 1080) * inputSize.text_height,
                text_x: inputSize.text_x,
                text_y: inputSize.text_y,
                font_file: fontUrl
            };
            console.log("Sending render request from useEffect due to inputSize change");
            sendRenderRequest(renderData);
        }
    }, [inputSize, textPos, text, fontUrl]);
*/
    const handleFontUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const blobUrl = URL.createObjectURL(file);
            setFontUrl(blobUrl);
        }
    };

    const imgRef = useRef();
    const resizingRef = useRef({ right: false, bottom: false });
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startSizeRef = useRef({ text_width: 0, text_height: 0 });

    const getFrameUrl = (index) => {
        const padded = String(index).padStart(3, '0');
        return `http://localhost:8000/frames/frame_${padded}.png`;
    };

    const waitForInputSizeChange = (currentVersion) => {
        return new Promise(resolve => {
            const interval = setInterval(() => {
            if (inputSizeVersionRef.current > currentVersion) {
                clearInterval(interval);
                resolve();
            }
            }, 10);
        });
    };

    const handleDragStop = async () => {
        console.log("handleDragStop init")
        if (!imgRef.current) {
            console.log("imgRef.current is false, returning...............")
            return;
        }
        const prevVersion = inputSizeVersion;
        
        console.log("before await")
        // Wait for the state to update
        await waitForInputSizeChange(prevVersion);
        console.log("awaiting")

        let newWidth = startSizeRef.current.text_width;
        let newHeight = startSizeRef.current.text_height;

        const imgBounds = imgRef.current.getBoundingClientRect();
        const { x, y } = textPos;

        if (
            x >= imgBounds.left &&
            y >= imgBounds.top &&
            x <= imgBounds.right &&
            y <= imgBounds.bottom
        ) {
            const currentInputSize = inputSizeRef.current;

            //console.log("using font_file",fontUrl);
            //console.log("handleDragStop init inside if");
            //console.log("text_width",currentInputSize.text_width);
            //console.log("text_height",currentInputSize.text_height);

            const renderData = {
                x: Math.floor(x - imgBounds.left),
                y: Math.floor(y - imgBounds.top),
                text,
                width: 1280,
                height: 720,
                duration: 10,
                text_width: (1280/1920)*currentInputSize.text_width,
                text_height: (720/1080)*currentInputSize.text_height,
                text_x: currentInputSize.text_x,
                text_y: currentInputSize.text_y,
                font_file: fontUrl
            };
            sendRenderRequest(renderData);
        }
    };

    const handleResizeStart = (e, direction) => {
        console.log("resize start init")
        console.log("text_width",inputSize.text_width);
        console.log("text_height",inputSize.text_height);
        e.stopPropagation();
        e.preventDefault();
        resizingRef.current[direction] = true;
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        startSizeRef.current = { ...inputSize };

        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', handleResizeStop);
    };

    const handleResize = (e) => {
        //let newWidth = inputSize.text_width;
        //let newHeight = inputSize.text_height;
        let newWidth = startSizeRef.current.text_width;
        let newHeight = startSizeRef.current.text_height;

        if (resizingRef.current.right) {
            const deltaX = e.clientX - startXRef.current;
            newWidth = Math.max(50, startSizeRef.current.text_width + deltaX);
        }

        if (resizingRef.current.bottom) {
            const deltaY = e.clientY - startYRef.current;
            newHeight = Math.max(30, startSizeRef.current.text_height + deltaY);
        }

        setInputSize(prev => ({
            ...prev,
            text_width: newWidth,
            text_height: newHeight
        }));
        console.log("handle resize width" , newWidth);
        console.log("handle resize input_width" , inputSize.text_width);
        console.log("handle resize height" , newHeight);
        console.log("handle resize input_height" , inputSize.text_height);
        setInputSizeVersion(v => {
            console.log("inputSizeVersion incremented:", v + 1);
            return v + 1;
        });
    };

    const handleResizeStop = () => {
        console.log("resize stop init");
        console.log("text_width",inputSize.text_width);
        console.log("text_height",inputSize.text_height);
        resizingRef.current = { right: false, bottom: false };
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeStop);
        handleDragStop();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleDragStop();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Draggable
                    defaultPosition={{ x: 0, y: 100 }}
                    onDrag={(e, data) => setTextPos({ x: data.x, y: data.y })}
                    onStop={handleDragStop}
                    cancel=".resize-handle"
                >
                    <div
                        style={{
                            width: inputSize.text_width,
                            height: inputSize.text_height,
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            border: '1px solid #aaa',
                            background: '#f5f5f5',
                            userSelect: 'none',
                            cursor: 'move',
                            resize: 'none',
                            boxSizing: 'border-box',
                        }}
                    >
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                height: '100%',
                                padding: '8px',
                                //fontSize: '16px',
                                fontSize: `${Math.max(12, inputSize.text_height)}px`,
                                fontFamily: fontUrl ? fontName : 'sans-serif',
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                            }}
                        />
                        {/* Right resize handle */}
                        <div
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, 'right')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                width: 10,
                                height: '100%',
                                cursor: 'ew-resize',
                                backgroundColor: 'transparent',
                            }}
                        />
                        {/* Bottom resize handle */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: 10,
                                width: '100%',
                                cursor: 'ns-resize',
                                backgroundColor: 'transparent',
                            }}
                        />
                    </div>
                </Draggable>

                <div style={{ backgroundColor: 'grey', marginLeft: 200 }}>
                    <img
                        src={getFrameUrl(frameIndex)}
                        ref={imgRef}
                        alt={`Frame ${frameIndex}`}
                        style={{
                            width: '100%',
                            maxWidth: 1280,
                            height: 720,
                            border: '1px solid #ccc',
                        }}
                    />
                </div>
            </div>

            <input
                type="range"
                min="0"
                max={totalFrames - 1}
                value={frameIndex}
                onChange={(e) => setFrameIndex(Number(e.target.value))}
                style={{ width: '100%', marginTop: '10px' }}
            />
            <div style={{ marginTop: '10px' }}>
                <label>Upload Font (.ttf): </label>
                <input type="file" accept=".ttf" onChange={handleFontUpload} />
            </div>
        </div>
    );
};

export default FrameWithDragText;
