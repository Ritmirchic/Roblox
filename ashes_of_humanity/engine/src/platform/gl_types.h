// Minimal self-contained OpenGL declarations (core profile 3.3).
// No system GL headers required so the engine builds identically on Windows
// and on the Linux headless test host.
#pragma once
#include <cstdint>

typedef unsigned int  GLenum;
typedef unsigned char GLboolean;
typedef unsigned int  GLbitfield;
typedef void           GLvoid;
typedef signed char   GLbyte;
typedef short          GLshort;
typedef int            GLint;
typedef unsigned char  GLubyte;
typedef unsigned short GLushort;
typedef unsigned int   GLuint;
typedef int            GLsizei;
typedef float          GLfloat;
typedef float          GLclampf;
typedef double         GLdouble;
typedef double         GLclampd;
typedef char           GLchar;
typedef std::uintptr_t GLsizeiptr;
typedef std::intptr_t  GLintptr;

typedef char           GLcharARB;

#define AOH_GLAPI extern "C"
#define AOH_GL_FUNCS(X)                                                              \
  X(void,   glGenBuffers,        (GLsizei n, GLuint *buffers))                       \
  X(void,   glDeleteBuffers,     (GLsizei n, const GLuint *buffers))                 \
  X(void,   glBindBuffer,        (GLenum target, GLuint buffer))                    \
  X(void,   glBufferData,        (GLenum target, GLsizeiptr size, const void *data, GLenum usage)) \
  X(void,   glBufferSubData,     (GLenum target, GLintptr offset, GLsizeiptr size, const void *data)) \
  X(void,   glGenVertexArrays,   (GLsizei n, GLuint *arrays))                        \
  X(void,   glDeleteVertexArrays,(GLsizei n, const GLuint *arrays))                  \
  X(void,   glBindVertexArray,   (GLuint array))                                    \
  X(void,   glEnableVertexAttribArray,  (GLuint index))                             \
  X(void,   glDisableVertexAttribArray, (GLuint index))                             \
  X(void,   glVertexAttribPointer,      (GLuint index, GLint size, GLenum type, GLboolean normalized, GLsizeiptr stride, const void *pointer)) \
  X(void,   glVertexAttribIPointer,     (GLuint index, GLint size, GLenum type, GLsizeiptr stride, const void *pointer)) \
  X(void,   glVertexAttribDivisor,      (GLuint index, GLuint divisor))              \
  X(GLuint, glCreateShader,      (GLenum type))                                     \
  X(void,   glShaderSource,      (GLuint shader, GLsizei count, const GLchar *const *string, const GLint *length)) \
  X(void,   glCompileShader,     (GLuint shader))                                  \
  X(void,   glGetShaderiv,       (GLuint shader, GLenum pname, GLint *params))      \
  X(void,   glGetShaderInfoLog,  (GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog)) \
  X(void,   glDeleteShader,      (GLuint shader))                                  \
  X(GLuint, glCreateProgram,     (void))                                            \
  X(void,   glAttachShader,      (GLuint program, GLuint shader))                  \
  X(void,   glDetachShader,      (GLuint program, GLuint shader))                  \
  X(void,   glLinkProgram,       (GLuint program))                                 \
  X(void,   glGetProgramiv,      (GLuint program, GLenum pname, GLint *params))     \
  X(void,   glGetProgramInfoLog, (GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog)) \
  X(void,   glUseProgram,        (GLuint program))                                 \
  X(void,   glDeleteProgram,     (GLuint program))                                 \
  X(GLint,  glGetUniformLocation,(GLuint program, const GLchar *name))              \
  X(void,   glUniform1i,         (GLint location, GLint v0))                       \
  X(void,   glUniform1f,         (GLint location, GLfloat v0))                     \
  X(void,   glUniform2f,         (GLint location, GLfloat v0, GLfloat v1))         \
  X(void,   glUniform3f,         (GLint location, GLfloat v0, GLfloat v1, GLfloat v2)) \
  X(void,   glUniform4f,         (GLint location, GLfloat v0, GLfloat v1, GLfloat v2, GLfloat v3)) \
  X(void,   glUniform1fv,        (GLint location, GLsizei count, const GLfloat *value)) \
  X(void,   glUniform3fv,        (GLint location, GLsizei count, const GLfloat *value)) \
  X(void,   glUniform4fv,        (GLint location, GLsizei count, const GLfloat *value)) \
  X(void,   glUniformMatrix3fv,  (GLint location, GLsizei count, GLboolean transpose, const GLfloat *value)) \
  X(void,   glUniformMatrix4fv,  (GLint location, GLsizei count, GLboolean transpose, const GLfloat *value)) \
  X(void,   glGenTextures,       (GLsizei n, GLuint *textures))                     \
  X(void,   glDeleteTextures,    (GLsizei n, const GLuint *textures))               \
  X(void,   glBindTexture,       (GLenum target, GLuint texture))                  \
  X(void,   glActiveTexture,     (GLenum texture))                                 \
  X(void,   glTexImage2D,        (GLenum target, GLint level, GLint internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, const void *pixels)) \
  X(void,   glTexSubImage2D,     (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width, GLsizei height, GLenum format, GLenum type, const void *pixels)) \
  X(void,   glCompressedTexImage2D, (GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, GLsizei imageSize, const void *data)) \
  X(void,   glTexParameteri,      (GLenum target, GLenum pname, GLint param))       \
  X(void,   glTexParameterfv,     (GLenum target, GLenum pname, const GLfloat *params)) \
  X(void,   glGenerateMipmap,     (GLenum target))                                 \
  X(void,   glGenFramebuffers,   (GLsizei n, GLuint *framebuffers))                 \
  X(void,   glDeleteFramebuffers,(GLsizei n, const GLuint *framebuffers))           \
  X(void,   glBindFramebuffer,   (GLenum target, GLuint framebuffer))              \
  X(void,   glFramebufferTexture2D, (GLenum target, GLenum attachment, GLenum textarget, GLuint texture, GLint level)) \
  X(GLenum, glCheckFramebufferStatus, (GLenum target))                              \
  X(void,   glGenRenderbuffers,  (GLsizei n, GLuint *renderbuffers))                \
  X(void,   glDeleteRenderbuffers,(GLsizei n, const GLuint *renderbuffers))          \
  X(void,   glBindRenderbuffer,  (GLenum target, GLuint renderbuffer))              \
  X(void,   glRenderbufferStorage,(GLenum target, GLenum internalformat, GLsizei width, GLsizei height)) \
  X(void,   glFramebufferRenderbuffer, (GLenum target, GLenum attachment, GLenum renderbuffertarget, GLuint renderbuffer)) \
  X(void,   glDrawBuffers,       (GLsizei n, const GLenum *bufs))                   \
  X(void,   glReadBuffer,        (GLenum src))                                      \
  X(void,   glBlitFramebuffer,   (GLint srcX0, GLint srcY0, GLint srcX1, GLint srcY1, GLint dstX0, GLint dstY0, GLint dstX1, GLint dstY1, GLbitfield mask, GLenum filter)) \
  X(void,   glClear,             (GLbitfield mask))                                 \
  X(void,   glClearColor,        (GLfloat r, GLfloat g, GLfloat b, GLfloat a))       \
  X(void,   glDepthMask,         (GLboolean flag))                                  \
  X(void,   glDepthFunc,         (GLenum func))                                    \
  X(void,   glCullFace,          (GLenum mode))                                    \
  X(void,   glFrontFace,         (GLenum mode))                                    \
  X(void,   glViewport,          (GLint x, GLint y, GLsizei width, GLsizei height)) \
  X(void,   glScissor,           (GLint x, GLint y, GLsizei width, GLsizei height))  \
  X(void,   glBlendFunc,         (GLenum sfactor, GLenum dfactor))                  \
  X(void,   glBlendFuncSeparate, (GLenum srcRGB, GLenum dstRGB, GLenum srcAlpha, GLenum dstAlpha)) \
  X(void,   glBlendEquation,     (GLenum mode))                                    \
  X(void,   glEnable,            (GLenum cap))                                     \
  X(void,   glDisable,           (GLenum cap))                                     \
  X(void,   glDrawElements,      (GLenum mode, GLsizei count, GLenum type, const void *indices)) \
  X(void,   glDrawElementsInstanced, (GLenum mode, GLsizei count, GLenum type, const void *indices, GLsizei instancecount)) \
  X(void,   glDrawArrays,        (GLenum mode, GLint first, GLsizei count))          \
  X(void,   glDrawArraysInstanced,(GLenum mode, GLint first, GLsizei count, GLsizei instancecount)) \
  X(void,   glPolygonOffset,     (GLfloat factor, GLfloat units))                  \
  X(GLenum, glGetError,          (void))                                           \
  X(const GLubyte *, glGetString, (GLenum name))                                   \
  X(void,   glGetIntegerv,       (GLenum pname, GLint *data))                       \
  X(void,   glGetFloatv,         (GLenum pname, GLfloat *data))                     \
  X(void,   glFinish,            (void))                                           \
  X(void,   glFlush,             (void))                                           \
  X(void,   glPixelStorei,       (GLenum pname, GLint param))                      \
  X(void,   glReadPixels,        (GLint x, GLint y, GLsizei width, GLsizei height, GLenum format, GLenum type, void *pixels)) \
  X(void,   glDispatchCompute,   (GLuint groupsX, GLuint groupsY, GLuint groupsZ))   \
  X(void,   glMemoryBarrier,     (GLbitfield barriers))                            \
  X(void,   glGenQueries,        (GLsizei n, GLuint *ids))                         \
  X(void,   glBeginQuery,        (GLenum target, GLuint id))                        \
  X(void,   glEndQuery,          (GLenum target))                                  \
  X(void,   glGetQueryObjectuiv, (GLuint id, GLenum pname, GLuint *params))

// GL 1.1 entry points (also loaded dynamically; kept separate for clarity).
#define AOH_GL11_FUNCS(X)                                                            \
  X(void,   glDrawElements11,   (GLenum mode, GLsizei count, GLenum type, const void *indices)) \
  X(void,   glBegin,            (GLenum mode))                                     \
  X(void,   glEnd,              (void))                                           \
  X(void,   glVertex3f,         (GLfloat x, GLfloat y, GLfloat z))                 \
  X(void,   glNormal3f,         (GLfloat x, GLfloat y, GLfloat z))                 \
  X(void,   glTexCoord2f,       (GLfloat u, GLfloat v))

#define AOH_DECL(ret, name, args) typedef ret (*PFN_##name) args; extern PFN_##name name;
AOH_GL_FUNCS(AOH_DECL)
#undef AOH_DECL

// Constants
#define GL_FALSE 0
#define GL_TRUE 1
#define GL_NO_ERROR 0
#define GL_NONE 0
#define GL_POINTS 0x0000
#define GL_LINES 0x0001
#define GL_LINE_LOOP 0x0002
#define GL_LINE_STRIP 0x0003
#define GL_TRIANGLES 0x0004
#define GL_TRIANGLE_STRIP 0x0005
#define GL_TRIANGLE_FAN 0x0006
#define GL_DEPTH_BUFFER_BIT 0x00000100
#define GL_STENCIL_BUFFER_BIT 0x00000400
#define GL_COLOR_BUFFER_BIT 0x00004000
#define GL_FALSE_ 0
#define GL_POINTS_ 0
#define GL_NEVER 0x0200
#define GL_LESS 0x0201
#define GL_EQUAL 0x0202
#define GL_LEQUAL 0x0203
#define GL_GREATER 0x0204
#define GL_NOTEQUAL 0x0205
#define GL_GEQUAL 0x0206
#define GL_ALWAYS 0x0207
#define GL_SRC_ALPHA 0x0302
#define GL_ONE_MINUS_SRC_ALPHA 0x0303
#define GL_SRC_ALPHA_SATURATE 0x0308
#define GL_ONE 1
#define GL_ZERO 0
#define GL_FRONT 0x0404
#define GL_BACK 0x0405
#define GL_FRONT_AND_BACK 0x0408
#define GL_CULL_FACE 0x0B44
#define GL_DEPTH_TEST 0x0B71
#define GL_STENCIL_TEST 0x0B90
#define GL_BLEND 0x0BE2
#define GL_SCISSOR_TEST 0x0C11
#define GL_MULTISAMPLE 0x809D
#define GL_ALPHA_TEST 0x0BC0
#define GL_POLYGON_OFFSET_FILL 0x8037
#define GL_PROGRAM_POINT_SIZE 0x8642
#define GL_TEXTURE_2D 0x0DE1
#define GL_TEXTURE_2D_ARRAY 0x8C1A
#define GL_TEXTURE_3D 0x806F
#define GL_TEXTURE_CUBE_MAP 0x8513
#define GL_RED 0x1903
#define GL_RGB 0x1907
#define GL_RGBA 0x1908
#define GL_BGRA 0x80E1
#define GL_RG 0x8227
#define GL_R8 0x8229
#define GL_RG8 0x822B
#define GL_R16F 0x822D
#define GL_R32F 0x822E
#define GL_RGBA8 0x8058
#define GL_RGB8 0x8051
#define GL_RGBA16F 0x881A
#define GL_RGBA32F 0x8814
#define GL_DEPTH_COMPONENT 0x1902
#define GL_DEPTH_COMPONENT16 0x81A5
#define GL_DEPTH_COMPONENT24 0x81A6
#define GL_DEPTH_COMPONENT32F 0x8CAC
#define GL_DEPTH_STENCIL 0x84F9
#define GL_UNSIGNED_BYTE 0x1401
#define GL_UNSIGNED_SHORT 0x1403
#define GL_UNSIGNED_INT 0x1405
#define GL_BYTE 0x1400
#define GL_SHORT 0x1402
#define GL_INT 0x1404
#define GL_FLOAT 0x1406
#define GL_HALF_FLOAT 0x140B
#define GL_UNSIGNED_INT_24_8 0x84FA
#define GL_VENDOR 0x1F00
#define GL_RENDERER 0x1F01
#define GL_VERSION 0x1F02
#define GL_EXTENSIONS 0x1F03
#define GL_SHADING_LANGUAGE_VERSION 0x8B8C
#define GL_NUM_EXTENSIONS 0x821D
#define GL_MAX_TEXTURE_SIZE 0x0D33
#define GL_MAX_TEXTURE_IMAGE_UNITS 0x8872
#define GL_MAX_VERTEX_ATTRIBS 0x8869
#define GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS 0x8B4D
#define GL_ARRAY_BUFFER 0x8892
#define GL_ELEMENT_ARRAY_BUFFER 0x8893
#define GL_UNIFORM_BUFFER 0x8A11
#define GL_STATIC_DRAW 0x88E4
#define GL_DYNAMIC_DRAW 0x88E8
#define GL_STREAM_DRAW 0x88E0
#define GL_FRAMEBUFFER 0x8D40
#define GL_READ_FRAMEBUFFER 0x8CA8
#define GL_DRAW_FRAMEBUFFER 0x8CA9
#define GL_RENDERBUFFER 0x8D41
#define GL_COLOR_ATTACHMENT0 0x8CE0
#define GL_DEPTH_ATTACHMENT 0x8D00
#define GL_DEPTH_STENCIL_ATTACHMENT 0x821A
#define GL_FRAMEBUFFER_COMPLETE 0x8CD5
#define GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT 0x8CD6
#define GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT 0x8CD7
#define GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS 0x8CD9
#define GL_FRAMEBUFFER_INCOMPLETE_FORMATS 0x8CDA
#define GL_FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER 0x8CDB
#define GL_FRAMEBUFFER_INCOMPLETE_READ_BUFFER 0x8CDC
#define GL_FRAMEBUFFER_UNSUPPORTED 0x8CDD
#define GL_COLOR_ATTACHMENT1 0x8CE1
#define GL_TEXTURE_MAG_FILTER 0x2800
#define GL_TEXTURE_MIN_FILTER 0x2801
#define GL_TEXTURE_WRAP_S 0x2802
#define GL_TEXTURE_WRAP_T 0x2803
#define GL_TEXTURE_WRAP_R 0x8072
#define GL_TEXTURE_MAX_LEVEL 0x813D
#define GL_TEXTURE_BASE_LEVEL 0x813C
#define GL_TEXTURE_COMPARE_MODE 0x884C
#define GL_NEAREST 0x2600
#define GL_LINEAR 0x2601
#define GL_LINEAR_MIPMAP_LINEAR 0x2703
#define GL_LINEAR_MIPMAP_NEAREST 0x2702
#define GL_NEAREST_MIPMAP_LINEAR 0x2702
#define GL_NEAREST_MIPMAP_NEAREST 0x2700
#define GL_REPEAT 0x2901
#define GL_CLAMP_TO_EDGE 0x812F
#define GL_CLAMP_TO_BORDER 0x812D
#define GL_MIRRORED_REPEAT 0x8370
#define GL_TEXTURE0 0x84C0
#define GL_TEXTURE1 0x84C1
#define GL_TEXTURE2 0x84C2
#define GL_TEXTURE3 0x84C3
#define GL_TEXTURE4 0x84C4
#define GL_TEXTURE5 0x84C5
#define GL_TEXTURE6 0x84C6
#define GL_TEXTURE7 0x84C7
#define GL_UNPACK_ALIGNMENT 0x0CF5
#define GL_PACK_ALIGNMENT 0x0D05
#define GL_FUNC_ADD 0x8006
#define GL_BLEND_EQUATION_RGB 0x8009
#define GL_BLEND_EQUATION_ALPHA 0x883D
#define GL_PRIMITIVES_GENERATED 0x8C87
#define GL_TIME_ELAPSED 0x88BF
#define GL_SAMPLES 0x80A9
#define GL_QUERY_RESULT 0x8866
#define GL_QUERY_RESULT_AVAILABLE 0x8867
#define GL_SHADER_COMPILER 0x8DFA
#define GL_VERTEX_SHADER 0x8B31
#define GL_FRAGMENT_SHADER 0x8B30
#define GL_COMPILE_STATUS 0x8B81
#define GL_LINK_STATUS 0x8B82
#define GL_INFO_LOG_LENGTH 0x8B84
#define GL_VALIDATE_STATUS 0x8B83
#define GL_DEBUG_OUTPUT 0x92E0
#define GL_GEOMETRY_SHADER 0x8DD9
#define GL_MULTISAMPLE_ 0
