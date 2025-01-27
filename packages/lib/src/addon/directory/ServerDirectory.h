#ifndef ___SERVER_DIRECTORY_H___
#define ___SERVER_DIRECTORY_H___

#include <napi.h>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
#import <Syphon/Syphon.h>

namespace syphon
{

  class ServerDirectoryWrapper : public Napi::ObjectWrap<ServerDirectoryWrapper>
  {
  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    ServerDirectoryWrapper(const Napi::CallbackInfo &info);
    ~ServerDirectoryWrapper();

    void Dispose(const Napi::CallbackInfo &info);
    void Listen(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;
    void _Dispose();
  };
}

#endif