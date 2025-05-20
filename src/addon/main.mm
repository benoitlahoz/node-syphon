#include "main.h"
#include <napi.h>

using namespace syphon;

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  OpenGLServerWrapper::Init(env, exports);
  OpenGLClientWrapper::Init(env, exports);
  MetalServerWrapper::Init(env, exports);
  MetalClientWrapper::Init(env, exports);
  ServerDirectoryWrapper::Init(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)