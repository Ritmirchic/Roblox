// HORIZON VELOCITY - Win32/raylib platform backend (window, input, present).
// NOTE: this file is the intended shipping path but was NOT compiled or run in
// the authoring sandbox (no Windows target, no display). See REPORT.md.
#if defined(_WIN32) || defined(HV_FORCE_RAYLIB)
#include "platform/platform.h"
#include "raylib.h"
#include <cstring>

namespace hv {

class RaylibPlatform : public Platform {
public:
    bool init(int w, int h, const char* title) override {
        SetConfigFlags(FLAG_VSYNC_HINT | FLAG_WINDOW_RESIZABLE);
        InitWindow(w, h, title);
        if (!IsWindowReady()) return false;
        image_ = GenImageColor(w, h, BLANK);
        tex_ = LoadTextureFromImage(image_);
        SetTargetFPS(240);
        SetExitKey(KEY_NULL);   // Esc is the pause key, not quit
        return true;
    }
    void poll(InputState& in) override {
        in = InputState();
        if (IsKeyDown(KEY_W)) in.throttle = 1.0f;
        if (IsKeyDown(KEY_S)) in.brake = 1.0f;
        if (IsKeyDown(KEY_A)) in.steer -= 1.0f;
        if (IsKeyDown(KEY_D)) in.steer += 1.0f;
        if (IsKeyDown(KEY_SPACE)) in.handbrake = 1.0f;
        if (IsKeyDown(KEY_LEFT_SHIFT)) in.camUp = 1.0f;
        if (IsKeyDown(KEY_LEFT_CONTROL)) in.camUp = -1.0f;
        if (IsKeyPressed(KEY_E)) in.shiftUp = true;
        if (IsKeyPressed(KEY_Q)) in.shiftDown = true;
        if (IsKeyPressed(KEY_T)) in.toggleAuto = true;
        if (IsKeyPressed(KEY_C)) in.cameraCycle = 1;
        if (IsKeyPressed(KEY_R)) in.reset = true;
        if (IsKeyPressed(KEY_M)) in.mapToggle = true;
        if (IsKeyPressed(KEY_P)) in.photoMode = true;
        if (IsKeyPressed(KEY_F)) in.interact = true;
        if (IsKeyPressed(KEY_ESCAPE)) in.pause = true;
        float axis = 0.0f;
        // gamepad: left stick steer, triggers throttle/brake
        if (IsGamepadAvailable(0)) {
            axis = GetGamepadAxisMovement(0, GAMEPAD_AXIS_LEFT_X);
            if (std::fabs(axis) > 0.12f) in.steer = axis;
            float rt = (GetGamepadAxisMovement(0, GAMEPAD_AXIS_RIGHT_TRIGGER) + 1.0f) * 0.5f;
            float lt = (GetGamepadAxisMovement(0, GAMEPAD_AXIS_LEFT_TRIGGER) + 1.0f) * 0.5f;
            if (rt > 0.05f) in.throttle = rt;
            if (lt > 0.05f) in.brake = lt;
            if (IsGamepadButtonPressed(0, GAMEPAD_BUTTON_RIGHT_FACE_DOWN)) in.cameraCycle = 1;
            if (IsGamepadButtonPressed(0, GAMEPAD_BUTTON_RIGHT_FACE_LEFT)) in.handbrake = 1.0f;
            if (IsGamepadButtonPressed(0, GAMEPAD_BUTTON_MIDDLE_RIGHT)) in.reset = true;
        }
        if (in.steer < -1.0f) in.steer = -1.0f;
        if (in.steer > 1.0f) in.steer = 1.0f;
    }
    void present(const uint8_t* rgba, int w, int h) override {
        if (w != image_.width || h != image_.height) {
            UnloadImage(image_); UnloadTexture(tex_);
            image_ = GenImageColor(w, h, BLANK);
            tex_ = LoadTextureFromImage(image_);
        }
        // the renderer writes RGBA; raylib expects RGBA8 too
        std::memcpy(image_.data, rgba, (size_t)w * h * 4);
        UpdateTexture(tex_, image_.data);
        BeginDrawing();
        ClearBackground(BLACK);
        DrawTexture(tex_, 0, 0, WHITE);
        EndDrawing();
    }
    bool shouldQuit() const override { return WindowShouldClose(); }
    double time() const override { return GetTime(); }
    void shutdown() override {
        UnloadTexture(tex_); UnloadImage(image_); CloseWindow();
    }
private:
    Image image_{};
    Texture2D tex_{};
};

std::unique_ptr<Platform> createPlatform() { return std::unique_ptr<Platform>(new RaylibPlatform()); }
std::unique_ptr<Platform> createNullPlatform() { return nullptr; }

} // namespace hv
#endif
