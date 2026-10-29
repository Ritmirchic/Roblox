// HORIZON VELOCITY - platform abstraction (window/input/present)
#pragma once
#include "game/game.h"
#include <memory>

namespace hv {

class Platform {
public:
    virtual ~Platform() {}
    virtual bool init(int w, int h, const char* title) = 0;
    virtual void poll(InputState& in) = 0;
    virtual void present(const uint8_t* rgba, int w, int h) = 0;
    virtual bool shouldQuit() const = 0;
    virtual double time() const = 0;
    virtual void shutdown() = 0;
};

std::unique_ptr<Platform> createPlatform();
std::unique_ptr<Platform> createNullPlatform();

} // namespace hv
