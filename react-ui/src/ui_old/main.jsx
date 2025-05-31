import React from 'react';
import ReactDOM from 'react-dom/client';
// import FrameCanvas from './FrameCanvas';
// import FrameCanvas2 from './FrameCanvas2';
// import Server_test from './Server_test';
//import FrameSlider from './FrameSlider';
import WebSocketClient from './WebSocketClient';
//import FramePlayer from './FramePlayer';
//import FramePlayerWithText from './FramePlayerWithText';
import FrameWithDragText from './FrameWithDragText';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WebSocketClient/>
    <FrameWithDragText sendRenderRequest={sendRenderRequest} />
    {/*<FramePlayer />*/}
    {/*<FrameSlider frameCount={300} frameUrlPrefix="http://localhost:8000/frames" />*/}
    {/*<FrameCanvas2/>*/}
    {/*<FrameCanvas />*/}
    {/*<Server_test/>*/}
     {/*<h1>Hello</h1>  lowercase tag for native HTML */}
  </React.StrictMode>
);
