#include <napi.h>
#include "main.h"

using namespace syphon;

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{

  SyphonOpenGLServerWrapper::Init(env, exports);
  SyphonOpenGLClientWrapper::Init(env, exports);
  SyphonServerDirectoryWrapper::Init(env, exports);

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)