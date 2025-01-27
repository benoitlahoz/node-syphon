#ifndef ___OPENGL_CLIENT_H___
#define ___OPENGL_CLIENT_H___

#include <napi.h>
#include <map>

#include <Foundation/Foundation.H>
#include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>
#include <OpenGL/gl.h>

// Macros.

#include "../helpers/macros.h"

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

    Napi::Value GetFrame(const Napi::CallbackInfo &info);
    Napi::Value Width(const Napi::CallbackInfo &info);
    Napi::Value Height(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;

    void _Dispose();

    uint8_t * ReadPixels(SyphonOpenGLClient *client);

    SyphonOpenGLClient *m_client;
    uint8_t * m_pixel_buffer;
    size_t m_width;
    size_t m_height;
  };
}

#endif