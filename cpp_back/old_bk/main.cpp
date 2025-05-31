#include <iostream>
#include <string>
#include <vector>
#include <filesystem>
#include <cstdio>
#include <cstring>
#include <ft2build.h>
#include FT_FREETYPE_H
#include <png.h>
#include <zlib.h>
#include <functional>
#include <thread>
#include <mutex>
#include <atomic>
#include <ixwebsocket/IXWebSocketServer.h>
// #include <nlohmann/json.hpp>
#include "external/json.hpp"

using json = nlohmann::json;

// const int WIDTH = 1280;
// const int HEIGHT = 720;
// const int FPS = 30;
// const int DURATION_MS = 10000;
// const int TOTAL_FRAMES = (DURATION_MS * FPS) / 1000;
// const int TEXT_WIDTH = 400;

// RGBA 8-bit per channel buffer
using PixelBuffer = std::vector<uint8_t>;

void clear_frames_folder(const std::string &folder)
{
    namespace fs = std::filesystem;
    if (fs::exists(folder) && fs::is_directory(folder))
    {
        for (auto &entry : fs::directory_iterator(folder))
        {
            try
            {
                fs::remove(entry.path());
            }
            catch (const fs::filesystem_error &e)
            {
                std::cerr << "Failed to remove " << entry.path() << ": " << e.what() << '\n';
            }
        }
    }
}

void ensure_ram_frame_dir(const std::string &frames_folder)
{
    const std::string path = frames_folder;
    try
    {
        std::filesystem::create_directories(path); // Like `mkdir -p`
    }
    catch (const std::filesystem::filesystem_error &e)
    {
        std::cerr << "Failed to create " << path << ": " << e.what() << '\n';
    }
}

void save_png_threaded(const std::string &filename, const uint8_t *rgba_data, int width, int height)
{
    FILE *fp = fopen(filename.c_str(), "wb");
    if (!fp)
        return;

    png_structp png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, nullptr, nullptr, nullptr);
    png_infop info_ptr = png_create_info_struct(png_ptr);

    if (setjmp(png_jmpbuf(png_ptr)))
    {
        fclose(fp);
        png_destroy_write_struct(&png_ptr, &info_ptr);
        return;
    }

    png_init_io(png_ptr, fp);
    png_set_compression_level(png_ptr, Z_BEST_SPEED);
    png_set_IHDR(png_ptr, info_ptr, width, height, 8, PNG_COLOR_TYPE_RGB,
                 PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);
    png_write_info(png_ptr, info_ptr);

    std::vector<png_bytep> row_pointers(height);
    for (int y = 0; y < height; ++y)
    {
        row_pointers[y] = const_cast<uint8_t *>(&rgba_data[y * width * 3]);
    }
    png_write_image(png_ptr, row_pointers.data());
    png_write_end(png_ptr, nullptr);

    png_destroy_write_struct(&png_ptr, &info_ptr);
    fclose(fp);
}

bool save_png(const std::string &filename, uint8_t *rgba_data, int width, int height)
{
    FILE *fp = fopen(filename.c_str(), "wb");
    if (!fp)
        return false;

    png_structp png = png_create_write_struct(PNG_LIBPNG_VER_STRING, nullptr, nullptr, nullptr);
    if (!png)
        return false;

    png_infop info = png_create_info_struct(png);
    if (!info)
        return false;

    if (setjmp(png_jmpbuf(png)))
        return false;

    png_init_io(png, fp);
    png_set_compression_level(png, Z_BEST_SPEED); // Options: Z_NO_COMPRESSION, Z_BEST_SPEED, Z_BEST_COMPRESSION
    png_set_IHDR(
        png, info, width, height, 8, PNG_COLOR_TYPE_RGBA,
        PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
    png_write_info(png, info);

    std::vector<png_bytep> row_pointers(height);
    for (int y = 0; y < height; y++)
    {
        row_pointers[y] = rgba_data + y * width * 4;
    }

    png_write_image(png, row_pointers.data());
    png_write_end(png, nullptr);

    fclose(fp);
    png_destroy_write_struct(&png, &info);

    return true;
}

std::string fit_text_to_width(FT_Face face, const std::string &input, int TEXT_WIDTH)
{
    std::string result;
    int total_width = 0;

    for (char c : input)
    {
        if (FT_Load_Char(face, c, FT_LOAD_RENDER) != 0)
            continue;

        int char_width = face->glyph->advance.x >> 6;

        if (total_width + char_width > TEXT_WIDTH)
            break;

        result += c;
        total_width += char_width;
    }

    return result;
}

void draw_text(FT_Face face, PixelBuffer &buffer, const std::string &text, int x, int y, uint8_t r, uint8_t g, uint8_t b, int width, int height)
{
    FT_GlyphSlot slot = face->glyph;
    for (char c : text)
    {
        if (FT_Load_Char(face, c, FT_LOAD_RENDER))
            continue;

        for (int row = 0; row < slot->bitmap.rows; row++)
        {
            for (int col = 0; col < slot->bitmap.width; col++)
            {
                int px = x + slot->bitmap_left + col;
                int py = y - slot->bitmap_top + row;

                if (px < 0 || px >= width || py < 0 || py >= height)
                    continue;

                uint8_t alpha = slot->bitmap.buffer[row * slot->bitmap.width + col];
                if (alpha == 0)
                    continue; // fully transparent

                uint8_t *pixel = &buffer[4 * (py * width + px)];

                // Alpha blending foreground text color (r,g,b) over background (pixel[0..2])
                float alpha_f = alpha / 255.0f;
                pixel[0] = uint8_t(r * alpha_f + pixel[0] * (1 - alpha_f));
                pixel[1] = uint8_t(g * alpha_f + pixel[1] * (1 - alpha_f));
                pixel[2] = uint8_t(b * alpha_f + pixel[2] * (1 - alpha_f));
                pixel[3] = 255; // opaque pixel
            }
        }

        x += slot->advance.x >> 6;
    }
}

int render_frames(const std::string &display_text,
        int width, int height,
        int duration_ms,
        int fps,
        const std::string &frames_folder,
        int num_threads,
        int text_width,
        int text_height,
        int text_x,
        int text_y,
        std::string font_file
    ){
    int total_frames = (duration_ms * fps) / 1000;
    // int text_width = text_width;
    //  std::string frames_folder = "/dev/shm/frames";
    ensure_ram_frame_dir(frames_folder);
    // std::filesystem::create_directories(frames_folder);
    clear_frames_folder(frames_folder);

    FT_Library ft;
    if (FT_Init_FreeType(&ft))
    {
        std::cerr << "Failed to init FreeType\n";
        return 1;
    }

    FT_Face face;
    if (FT_New_Face(ft, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 0, &face))
    {
        std::cerr << "Failed to load font\n";
        return 1;
    }

    //FT_Set_Pixel_Sizes(face, 0, 64);
    FT_Set_Pixel_Sizes(face, 0, text_height);
    auto start = std::chrono::high_resolution_clock::now();
    unsigned int n_threads = std::thread::hardware_concurrency();

    std::atomic<int> next_frame{0};
    std::mutex ft_mutex;
    std::vector<std::thread> threads;

    // for (int frame = 0; frame < total_frames; frame++) {
    for (int i = 0; i < num_threads; ++i)
    {
        threads.emplace_back([&]()
                             {
            while (true) {
                int frame = next_frame.fetch_add(1);
                if (frame >= total_frames) break;

                PixelBuffer buffer(width * height * 4, 0);

                // Interpolate x position: right to left
                //int startX = width - text_width;
                int startX = width;
                int endX = -text_width;
                //int x = startX + (endX - startX) * frame / total_frames;
                int x = startX + (endX - startX) * frame / total_frames;
                //int y = 150;
                int y = text_height + 20;
                //std::string full_message = "This text should fit into the given width";
                std::string full_message = display_text;

                //std::string message = fit_text_to_width(face, full_message, text_width);  
                std::string message;
                // Must lock FreeType access (not thread-safe)
                static std::mutex ft_mutex;
                {
                    std::lock_guard<std::mutex> lock(ft_mutex);
                    message = fit_text_to_width(face, full_message, text_width);
                    draw_text(face, buffer, display_text, x, y, 255, 255, 255, width, height);
                    //draw_text(face, buffer, display_text, x, y, 255, 255, 255, text_width, text_height);

                }
                //draw_text(face, buffer, message, x, y, 255, 255, 255, width, height);

                char filename[256];
                //std::string png_filename = frames_folder + "/frame_" + std::to_string()
                
                snprintf(filename, sizeof(filename), "%s/frame_%03d.png", frames_folder.c_str(), frame);
                if (!save_png(filename, buffer.data(), width, height)) {
                    std::cerr << "Failed to save " << filename << "\n";
                } else {
                    //std::cout << "Saved " << filename << "\n";
                    std::cout << "Generating text on x: " << x << " & y: " << y << "\n";
                }
                std::cout << "Hardware concurrency: " << n_threads << " threads\n";
                //buffer.clear();
                //buffer.shrink_to_fit();
            } });
    }
    // Join all threads
    for (auto &t : threads)
    {
        t.join();
    }
    auto end = std::chrono::high_resolution_clock::now();

    std::chrono::duration<double, std::milli> end_duration_ms = end - start;
    std::cout << "Frames written in " << end_duration_ms.count() << " ms\n";

    FT_Done_Face(face);
    FT_Done_FreeType(ft);
    return end_duration_ms.count();
}

std::atomic<bool> busy{false};
std::mutex render_mutex;

void start_websocket_server(int port = 9002)
{
    ix::WebSocketServer server(port);

    std::atomic<bool> busy{false};
    std::mutex render_mutex;

    server.setOnClientMessageCallback(
        [&](std::shared_ptr<ix::ConnectionState> connectionState,
            ix::WebSocket& webSocket,
            const ix::WebSocketMessagePtr& msg)
        {
            if (msg->type == ix::WebSocketMessageType::Message)
            {
                try
                {
                    auto input = nlohmann::json::parse(msg->str);

                    std::string text = input.value("text", "Hello World");
                    int width = input.value("width", 1280);
                    int height = input.value("height", 720);
                    int fps = input.value("fps", 30);
                    int duration_ms = input.value("duration_ms", 10000);
                    int thread_count = input.value("thread_count", 4);
                    int text_width = input.value("text_width",400);
                    int text_height = input.value("text_height",80);
                    int text_x = input.value("text_x", 0);
                    int text_y = input.value("text_y", 0);
                    std::string font_file = input.value("font_file","/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf");
                    std::string frames_folder = "/dev/shm/frames";

                    if (busy.load())
                    {
                        webSocket.send("Render already in progress, please wait");
                        return;
                    }

                    busy.store(true);

                    // Create a shared_ptr copy of the websocket for thread-safe usage
                    //auto ws_ptr = std::make_shared<ix::WebSocket>(webSocket);

                    std::thread render_thread([&, text, width, height, fps, duration_ms, thread_count, frames_folder, text_width, text_height, text_x, text_y, font_file]() {
                        std::lock_guard<std::mutex> lock(render_mutex);

                        webSocket.send("Render started");

                        int time_to_render = render_frames(text, width, height, duration_ms, fps, frames_folder, thread_count, text_width, text_height, text_x, text_y, font_file);

                        //webSocket.send("Render finished in: ");
                        webSocket.send("Render finished in: "+std::to_string(time_to_render)+" ms");
                        //webSocket.send(stoi(input));

                        busy.store(false);
                    });
                    render_thread.detach();
                }
                catch (const std::exception& e)
                {
                    webSocket.send(std::string("JSON parse error: ") + e.what());
                }
            }
        });

    auto result = server.listen();
    if (!result.first)
    {
        std::cerr << "Failed to start server on port " << port
                << ": " << result.second << std::endl;
        return;
    }

    server.start();
    std::cout << "WebSocket server listening on ws://localhost:" << port << "\nPress Enter to quit.\n";
    std::cin.get();
    server.stop();
}

int main(int argc, char **argv)
{

    start_websocket_server();
    return 0;
    // Start WebSocket server thread
    // std::thread ws_thread(start_websocket_server);
    // ws_thread.join();
    /*
    return 0;
    if (argc < 7) {
        std::cerr << "Usage: " << argv[0] << " <width> <height> <duration_sec> <fps> <frame_dir> <thread_count>\n";
        return 1;
    }
    //std::vector<std::thread> threads;
    const int num_threads = std::stoi(argv[6]);  // fixed number of threads

    int width = std::stoi(argv[1]);
    int height = std::stoi(argv[2]);
    int duration_ms = std::stoi(argv[3]) * 1000;
    int fps = std::stoi(argv[4]);
    std::string frames_folder = argv[5];
    */
}
