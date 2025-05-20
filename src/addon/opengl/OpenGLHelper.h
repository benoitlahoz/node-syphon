#ifndef ___OPENGL_HELPER_H___
#define ___OPENGL_HELPER_H___

#include <Cocoa/Cocoa.h>
#include <Foundation/Foundation.h>
#include <OpenGL/gl.h>
#include <napi.h>

namespace syphon {
class OpenGLHelper : public Napi::ObjectWrap<OpenGLHelper> {
public:
  static CGLContextObj CreateContext(Napi::Env env);
  static uint8_t *TextureToUint8(GLuint texture, size_t width, size_t height);
  static void Uint8ToTexture(GLenum textureTarget, GLuint texture, size_t width,
                             size_t height, uint8_t *data);
};
} // namespace syphon

#endif