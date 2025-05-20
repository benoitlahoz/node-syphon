#include "OpenGLHelper.h"

using namespace syphon;

// Thanks to
// https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
CGLContextObj OpenGLHelper::CreateContext(Napi::Env env) {
  CGLContextObj context;

  CGLPixelFormatAttribute attributes[3] = {kCGLPFAAccelerated,
                                           kCGLPFANoRecovery,
                                           // kCGLPFADoubleBuffer,
                                           (CGLPixelFormatAttribute)0};

  CGLPixelFormatObj pix;
  GLint num;

  CGLError error_code;
  error_code = CGLChoosePixelFormat(attributes, &pix, &num);

  if (error_code > 0) {
    printf("Error 1\n");
    Napi::Error::New(env, CGLErrorString(error_code))
        .ThrowAsJavaScriptException();
  }

  error_code = CGLCreateContext(pix, NULL, &context);
  if (error_code > 0) {
    printf("Error 2\n");
    Napi::Error::New(env, CGLErrorString(error_code))
        .ThrowAsJavaScriptException();
  }

  CGLDestroyPixelFormat(pix);

  return context;
}

uint8_t *OpenGLHelper::TextureToUint8(GLuint texture, size_t width,
                                      size_t height) {
  uint8_t *pixel_buffer = new uint8_t[width * height * 4];
  std::memset(pixel_buffer, 0, width * height * 4);

  GLuint fbo;

  CGLLockContext(CGLGetCurrentContext());

  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                         GL_TEXTURE_RECTANGLE_EXT, texture, 0);

  glEnable(GL_TEXTURE_RECTANGLE_EXT);
  glDisable(GL_DEPTH_TEST);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, texture);
  glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, pixel_buffer);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &fbo);

  CGLUnlockContext(CGLGetCurrentContext());

  return pixel_buffer;
}

void OpenGLHelper::Uint8ToTexture(GLenum textureTarget, GLuint texture,
                                  size_t width, size_t height, uint8_t *data) {
  glEnable(textureTarget);
  glBindTexture(textureTarget, texture);

  glTexImage2D(textureTarget, 0, GL_RGBA, width, height, 0, GL_RGBA,
               GL_UNSIGNED_BYTE, data);

  glTexParameteri(textureTarget, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(textureTarget, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

  glBindTexture(texture, 0);
  glDisable(textureTarget);
}