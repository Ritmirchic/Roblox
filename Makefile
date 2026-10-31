CXX      := g++
CXXFLAGS := -std=c++17 -O3 -ffast-math -march=native -fopenmp -funroll-loops -fPIC -Wall -Wextra
LDFLAGS  := -shared -fopenmp

SRCS := csrc/tensor_ops.cpp \
        csrc/anime_palette_synth.cpp \
        csrc/models.cpp \
        csrc/media_codecs.cpp \
        csrc/capi.cpp

TARGET := bin/libsakuga.so

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SRCS) csrc/sakuga_core.hpp csrc/anime_palette_synth.hpp csrc/models.hpp csrc/media_codecs.hpp
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) $(SRCS) -o $(TARGET) $(LDFLAGS)

clean:
	rm -f $(TARGET)
