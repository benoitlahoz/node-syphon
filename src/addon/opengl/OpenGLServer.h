#ifndef ___OPENGL_SERVER_H___
#define ___OPENGL_SERVER_H___

#include <map>
#include <napi.h>

#include <Cocoa/Cocoa.h>
#include <Foundation/Foundation.h>
#include <IOSurface/IOSurface.h>
#include <OpenGL/OpenGL.h>
#include <Syphon/Syphon.h>

// Macros.

#include "../helpers/macros.h"

namespace syphon {

class OpenGLServerWrapper : public Napi::ObjectWrap<OpenGLServerWrapper> {

public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  OpenGLServerWrapper(const Napi::CallbackInfo &info);
  ~OpenGLServerWrapper();

  static bool HasInstance(Napi::Value value);

  void Dispose(const Napi::CallbackInfo &info);

  void PublishImageData(const Napi::CallbackInfo &info);
  void PublishSurfacehandle(const Napi::CallbackInfo &info);

  Napi::Value GetName(const Napi::CallbackInfo &info);
  Napi::Value GetServerDescription(const Napi::CallbackInfo &info);
  Napi::Value HasClients(const Napi::CallbackInfo &info);

  SyphonOpenGLServer *m_server;

private:
  static Napi::FunctionReference constructor;

  bool m_first_check_passed;
  GLuint m_texture;
};
} // namespace syphon

#endif