#ifndef ___NODE_SYPHON_SERVER_DIRECTORY_H___
#define ___NODE_SYPHON_SERVER_DIRECTORY_H___

#include <napi.h>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
#import <Syphon/Syphon.h>

namespace syphon
{

  class SyphonServerDirectoryWrapper : public Napi::ObjectWrap<SyphonServerDirectoryWrapper>
  {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SyphonServerDirectoryWrapper(const Napi::CallbackInfo &info);
    ~SyphonServerDirectoryWrapper();

    void Dispose(const Napi::CallbackInfo &info);
    void Listen(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;

    void _Dispose();
  };
}

#endif