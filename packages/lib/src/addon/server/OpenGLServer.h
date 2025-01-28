#ifndef ___OPENGL_SERVER_H___
#define ___OPENGL_SERVER_H___

#include <napi.h>
#include <map>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
// #import <OpenGL/OpenGL.h>
#import <Syphon/Syphon.h>

#include <OpenGL/gl.h>

// Macros.

#include "../helpers/macros.h"

namespace syphon
{

  class OpenGLServerWrapper : public Napi::ObjectWrap<OpenGLServerWrapper>
  {

  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    OpenGLServerWrapper(const Napi::CallbackInfo &info);
    ~OpenGLServerWrapper();

    static bool HasInstance(Napi::Value value);

    void Dispose(const Napi::CallbackInfo &info);

    void PublishImageData(const Napi::CallbackInfo &info);
    // void PublishFrameTexture(const Napi::CallbackInfo &info);
    void On(const Napi::CallbackInfo &info);

    // Class listeners.

    // static void On(const Napi::CallbackInfo &info);

    // Accessors.

    Napi::Value GetName(const Napi::CallbackInfo &info);
    Napi::Value GetServerDescription(const Napi::CallbackInfo &info);
    Napi::Value HasClients(const Napi::CallbackInfo &info);

    // Properties.

    SyphonOpenGLServer *m_server;
    std::map<std::string, std::vector<Napi::ThreadSafeFunction>> m_listeners;
    int m_callbacks_count;

  private:
    static Napi::FunctionReference constructor;

    void _CreateCurrentContext(Napi::Env env);
    void _GenerateTexture(GLenum textureTarget, GLsizei width, GLsizei height, uint8_t *data);

    bool _first_check_passed;
    GLenum _texture;
    void _Dispose();
  };
}

#endif