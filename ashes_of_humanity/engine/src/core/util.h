#pragma once
#include "core/math.h"
#include <string>
#include <vector>

namespace aoh {

// ---- logging -------------------------------------------------------------
enum class LogLevel { Trace, Info, Warn, Error, Critical };
void logInit(const std::string& logFile);
void logMsg(LogLevel lvl, const char* file, int line, const std::string& msg);
void logShutdown();
#define LOGI(...)  ::aoh::logMsg(::aoh::LogLevel::Info,  __FILE__, __LINE__, ::aoh::formatStr(__VA_ARGS__))
#define LOGW(...)  ::aoh::logMsg(::aoh::LogLevel::Warn,  __FILE__, __LINE__, ::aoh::formatStr(__VA_ARGS__))
#define LOGE(...)  ::aoh::logMsg(::aoh::LogLevel::Error, __FILE__, __LINE__, ::aoh::formatStr(__VA_ARGS__))
#define LOGC(...)  ::aoh::logMsg(::aoh::LogLevel::Critical,__FILE__, __LINE__, ::aoh::formatStr(__VA_ARGS__))
#define LOGD(...)  do{}while(0)

std::string formatStr(const char* fmt, ...);

// ---- files ----------------------------------------------------------------
bool fileExists(const std::string& path);
bool dirExists(const std::string& path);
bool makeDirs(const std::string& path);
std::vector<u8> readFile(const std::string& path, bool* ok = nullptr);
std::string readTextFile(const std::string& path);
bool writeFile(const std::string& path, const void* data, size_t size);
bool writeTextFile(const std::string& path, const std::string& text);
std::vector<std::string> listDir(const std::string& path);
std::string exeDir();
std::string dataRoot();     // resolved game data directory
void setDataRoot(const std::string& p);
std::string joinPath(const std::string& a, const std::string& b);

// ---- strings --------------------------------------------------------------
std::string toLower(std::string s);
std::string toUpper(std::string s);
std::string trim(const std::string& s);
bool startsWith(const std::string& s, const std::string& p);
bool endsWith(const std::string& s, const std::string& p);
std::vector<std::string> splitStr(const std::string& s, char delim);
std::string replaceAll(std::string s, const std::string& from, const std::string& to);
std::string formatFloat(float v, int decimals = 2);

// ---- timing ---------------------------------------------------------------
f64 timeNow();      // seconds
f64 timeDelta();
u64  frameCount();

// ---- misc -----------------------------------------------------------------
std::string uuid4();
}
