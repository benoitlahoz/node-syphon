#include "OpenGLContextHelper.h"

using namespace syphon;

// Thanks to https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
CGLContextObj OpenGLContextHelper::Create(Napi::Env env)
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
    Napi::Error::New(env, CGLErrorString(error_code)).ThrowAsJavaScriptException();
  }

  error_code = CGLCreateContext(pix, NULL, &context);
  if (error_code > 0) {
    Napi::Error::New(env, CGLErrorString(error_code)).ThrowAsJavaScriptException();
  }

  CGLDestroyPixelFormat(pix);

  return context;
}