#!/bin/bash

set -e

FPS=30
FRAME_DIR="/dev/shm/frames"
VIDEO_OUTPUT="output.mp4"
PYTHON_SERVER="server.py"
OUTPUT_BINARY="FfmpegTextRender"

mkdir -p build
cd build
cmake ..
make -j$(nproc)

# Copy executable to project root for convenience
cp $OUTPUT_BINARY ../

cd ..

echo "Running $OUTPUT_BINARY server..."
# Run the executable in the background (so the script continues)
./$OUTPUT_BINARY 

# Save the server PID if you want to kill it later
SERVER_PID=$!

echo "Server started with PID $SERVER_PID"

echo "🎞️ Encoding PNG frames to $VIDEO_OUTPUT..."
ffmpeg -y -framerate $FPS -i $FRAME_DIR/frame_%03d.png -c:v libx264 -pix_fmt yuv420p $VIDEO_OUTPUT

echo "✅ Done! Output video: $VIDEO_OUTPUT"

# Optional: stop the server after encoding is done
#kill $SERVER_PID
#echo "Server stopped."
