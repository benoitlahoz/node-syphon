#ifndef ___SERVER_DIRECTORY_H___
#define ___SERVER_DIRECTORY_H___

#include <napi.h>
#include <Foundation/Foundation.H>
#include <Cocoa/Cocoa.h>
#include <OpenGL/gl.h>

namespace syphon
{
  class OpenGLContextHelper : public Napi::ObjectWrap<OpenGLContextHelper>
  {
    public:
        static CGLContextObj Create(Napi::Env env);
  };
}

#endif