#ifndef ___OPENGL_CLIENT_H___
#define ___OPENGL_CLIENT_H___

#include <napi.h>
#include <Foundation/Foundation.h>
// #include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>
#include <OpenGL/gl.h>
#include "../helpers/macros.h"
#include "../event-listeners/FrameEventListener.h"

namespace syphon
{

  class OpenGLClientWrapper : public Napi::ObjectWrap<OpenGLClientWrapper>
  {

  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static bool HasInstance(Napi::Value value);

    OpenGLClientWrapper(const Napi::CallbackInfo &info);
    ~OpenGLClientWrapper();

    void Dispose(const Napi::CallbackInfo &info);
    void On(const Napi::CallbackInfo &info);
    void Off(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;

    SyphonOpenGLClient * m_client;
    FrameEventListener * m_frame_listener;
  };
}

#endif