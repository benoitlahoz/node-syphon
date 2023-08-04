#ifndef ___NODE_SYPHON_SERVER_DIRECTORY_H___
#define ___NODE_SYPHON_SERVER_DIRECTORY_H___

#include <napi.h>

#import "EasySocket.hpp"

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

    Napi::Value Servers(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;

//    masesk::EasySocket _socketManager;
    // dispatch_queue_t _queue;
    // dispatch_queue_t _other;

    /*
    id __block _announce_observer;
    id __block _retire_observer;
    id __block _update_observer;
    */
    void _Dispose();
  };
}

#endif