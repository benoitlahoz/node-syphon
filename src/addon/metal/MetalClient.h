#ifndef ___METAL_CLIENT_H___
#define ___METAL_CLIENT_H___

#include <napi.h>
#include <Foundation/Foundation.h>
// #include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>
#include <Metal/Metal.h>
#include <Accelerate/Accelerate.h>
#include "../helpers/macros.h"
#include "../event-listeners/FrameEventListener.h"

namespace syphon
{

  class MetalClientWrapper : public Napi::ObjectWrap<MetalClientWrapper>
  {

  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static bool HasInstance(Napi::Value value);

    MetalClientWrapper(const Napi::CallbackInfo &info);
    ~MetalClientWrapper();

    void Dispose(const Napi::CallbackInfo &info);
    void On(const Napi::CallbackInfo &info);
    void Off(const Napi::CallbackInfo &info);

  private:
    static Napi::FunctionReference constructor;

    SyphonMetalClient * m_client;
    id<MTLDevice> m_device;
    id<MTLCommandQueue> m_queue;
    FrameEventListener * m_frame_listener;
  };
}

#endif