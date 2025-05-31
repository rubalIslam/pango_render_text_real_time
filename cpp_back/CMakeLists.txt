cmake_minimum_required(VERSION 3.10)
project(FfmpegTextRender)

set(CMAKE_CXX_STANDARD 17)

find_package(PkgConfig REQUIRED)

pkg_check_modules(FREETYPE REQUIRED freetype2)
pkg_check_modules(PNG REQUIRED libpng)
pkg_check_modules(IXWEBSOCKET REQUIRED ixwebsocket)
pkg_check_modules(PANGOCAIRO REQUIRED pangocairo)
pkg_check_modules(PANGOFT2 REQUIRED pangoft2)
pkg_check_modules(CAIRO REQUIRED cairo)

find_package(nlohmann_json REQUIRED)

include_directories(
    ${FREETYPE_INCLUDE_DIRS}
    ${PNG_INCLUDE_DIRS}
    ${CMAKE_SOURCE_DIR}/uWebSockets/src
    ${CMAKE_SOURCE_DIR}/uWebSockets/uSockets/src
    ${PANGOFT2_INCLUDE_DIRS}
    ${PANGOCARIO_INCLUDE_DIRS}
    ${CAIRO_INCLUDE_DIRS}
    /home/bedarul/ui_vid_editor/cpp_back/uWebSockets/src
    /usr/local/include
)

add_executable(FfmpegTextRender main.cpp)
add_definitions(-D_GNU_SOURCE)

link_directories(
    /usr/local/lib
    ${PANGOFT2_LIBRARY_DIRS}
    ${CAIRO_LIBRARY_DIRS}    
)
target_compile_options(FfmpegTextRender PRIVATE
    ${FREETYPE_CFLAGS_OTHER}
    ${PNG_CFLAGS_OTHER}
    ${IXWEBSOCKET_CFLAGS_OTHER}
    ${PANGOCAIRO_CFLAGS_OTHER}
    ${PANGOFT2_CFLAGS_OTHER}
    ${CAIRO_CFLAGS_OTHER}
)

#target_include_directories(${IXWEBSOCKET_INCLUDE_DIRS})

target_link_libraries(FfmpegTextRender
    ${IXWEBSOCKET_LIBRARIES} 
    nlohmann_json::nlohmann_json
    ${FREETYPE_LIBRARIES}
    ${PNG_LIBRARIES}
    ${PANGOCARIO_LIBRARIES}
    ${PANGOFT2_LIBRARIES}
    ${CAIRO_LIBRARIES}
    z pthread
    png
)
