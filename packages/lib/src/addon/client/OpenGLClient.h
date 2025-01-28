#ifndef ___OPENGL_CLIENT_H___
#define ___OPENGL_CLIENT_H___

#include <napi.h>
#include <Foundation/Foundation.H>
#include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>
#include <OpenGL/gl.h>
#include "../helpers/macros.h"
#include "../event-listeners/FrameEventListeners.h"

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

  private:
    static Napi::FunctionReference constructor;

    SyphonOpenGLClient * m_client;
    FrameEventListeners * m_frame_listeners;
  };
}

#endif