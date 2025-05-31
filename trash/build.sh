#!/bin/bash
#18014 ms
#37082.1
#37549.9
#19937.4
#4190.37
#6574.44 - 4 threads
#23181.9 - 1 threads
#3622.84 - 12 threads
#4919.72 - 4 threads
set -e

# === Configuration ===
WIDTH=1920
HEIGHT=1080
DURATION=10
FPS=30
OUTPUT_BINARY="render_pngs"
FRAME_DIR="/dev/shm/frames"
#FRAME_DIR="frames"
VIDEO_OUTPUT="output.mp4"

THREAD_COUNT=6

# === Step 1: Build ===
echo "🔧 Building C++ frame renderer..."
mkdir -p build
cd build
cmake ..
make
cp FfmpegTextRender ../$OUTPUT_BINARY
cd ..

# === Step 2: Run binary to generate frames ===
echo "🎨 Generating PNG frames ($WIDTH x $HEIGHT, $DURATION sec at $FPS FPS)..."
./$OUTPUT_BINARY $WIDTH $HEIGHT $DURATION $FPS $FRAME_DIR $THREAD_COUNT

# === Step 3: Encode frames into video using ffmpeg ===
echo "🎞️ Encoding PNG frames to $VIDEO_OUTPUT..."
ffmpeg -y -framerate $FPS -i $FRAME_DIR/frame_%03d.png -c:v libx264 -pix_fmt yuv420p $VIDEO_OUTPUT

echo "✅ Done! Output video: $VIDEO_OUTPUT"
