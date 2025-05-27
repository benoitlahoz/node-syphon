#ifndef ___SERVER_DIRECTORY_H___
#define ___SERVER_DIRECTORY_H___

#include <Cocoa/Cocoa.h>
#include <Foundation/Foundation.h>
#include <Syphon/Syphon.h>
#include <napi.h>

namespace syphon {

class ServerDirectoryWrapper : public Napi::ObjectWrap<ServerDirectoryWrapper> {
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
} // namespace syphon

#endif