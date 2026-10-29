// HORIZON VELOCITY - headless platform (verification builds, CI, --shots)
#include "platform/platform.h"

namespace hv {

class NullPlatform : public Platform {
public:
    bool init(int, int, const char*) override { return true; }
    void poll(InputState&) override {}
    void present(const uint8_t*, int, int) override {}
    bool shouldQuit() const override { return true; }
    double time() const override { return 0.0; }
    void shutdown() override {}
};

std::unique_ptr<Platform> createPlatform() { return nullptr; }   // no window backend in this build
std::unique_ptr<Platform> createNullPlatform() { return std::unique_ptr<Platform>(new NullPlatform()); }

} // namespace hv
