#ifndef ___NODE_SYPHON_OPENGL_CLIENT_H___
#define ___NODE_SYPHON_OPENGL_CLIENT_H___

#include <napi.h>
#include <map>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
#import <OpenGL/OpenGL.h>
#import <Syphon/Syphon.h>

// #include <OpenGL/gl.h>
#include <OpenGL/gl3.h>

// Macros.

#include "../helpers/macros.h"

namespace syphon
{

  class SyphonOpenGLClientWrapper : public Napi::ObjectWrap<SyphonOpenGLClientWrapper>
  {

  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SyphonOpenGLClientWrapper(const Napi::CallbackInfo &info);
    ~SyphonOpenGLClientWrapper();

    static bool HasInstance(Napi::Value value);

    void Dispose(const Napi::CallbackInfo &info);

    Napi::Value GetFrame(const Napi::CallbackInfo &info);

    Napi::Value Width(const Napi::CallbackInfo &info);
    Napi::Value Height(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;
    void _Dispose();
    void _CreateCurrentContext(Napi::Env env);

    SyphonOpenGLClient *m_client;
    size_t m_width;
    size_t m_height;
  };
}

#endif