#include "OpenGLHelper.h"

using namespace syphon;

// Thanks to https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
CGLContextObj OpenGLHelper::CreateContext(Napi::Env env)
{
  CGLContextObj context;

  CGLPixelFormatAttribute attributes[3] = {
    kCGLPFAAccelerated, 
    kCGLPFANoRecovery,
    // kCGLPFADoubleBuffer,
    (CGLPixelFormatAttribute) 0
  };

  CGLPixelFormatObj pix;
  GLint num; 

  CGLError error_code;
  error_code = CGLChoosePixelFormat(attributes, &pix, &num);

  if (error_code > 0) {
    printf("Error 1\n");
    Napi::Error::New(env, CGLErrorString(error_code)).ThrowAsJavaScriptException();
  }

  error_code = CGLCreateContext(pix, NULL, &context);
  if (error_code > 0) {
    printf("Error 2\n");
    Napi::Error::New(env, CGLErrorString(error_code)).ThrowAsJavaScriptException();
  }

  CGLDestroyPixelFormat(pix);

  return context;
}

uint8_t * OpenGLHelper::TextureToUint8(GLuint texture, size_t width, size_t height)
{
  uint8_t* pixel_buffer = new uint8_t[width * height * 4];
  std::memset(pixel_buffer, 0, width * height * 4);

  GLuint fbo;

  CGLLockContext(CGLGetCurrentContext());
  
  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_RECTANGLE_EXT, texture, 0);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, texture);

  glViewport(0, 0, width, height);
  glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
  // glClear(GL_COLOR_BUFFER_BIT); 

  glEnable(GL_TEXTURE_RECTANGLE_EXT);
  glDisable(GL_DEPTH_TEST);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, texture);

  glBegin(GL_QUADS);
  
  glTexCoord2f(0.0f, 0.0f); glVertex2f(-1.0f, -1.0f);
  glTexCoord2f(width, 0.0f); glVertex2f(1.0f, -1.0f);
  glTexCoord2f(width, height); glVertex2f(1.0f, 1.0f);
  glTexCoord2f(0.0f, height); glVertex2f(-1.0f, 1.0f);

  glEnd();

  glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, pixel_buffer);
  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &fbo);

  CGLUnlockContext(CGLGetCurrentContext());

  return pixel_buffer;
}