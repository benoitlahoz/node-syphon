#ifndef ___METAL_CLIENT_H___
#define ___METAL_CLIENT_H___

#include <Foundation/Foundation.h>
#include <napi.h>
// #include <Cocoa/Cocoa.h>
#include "../event-listeners/FrameEventListener.h"
#include "../event-listeners/TextureEventListener.h"
#include "../helpers/macros.h"
#include <Accelerate/Accelerate.h>
#include <Metal/Metal.h>
#include <Syphon/Syphon.h>

namespace syphon {

class MetalClientWrapper : public Napi::ObjectWrap<MetalClientWrapper> {

public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static bool HasInstance(Napi::Value value);

  MetalClientWrapper(const Napi::CallbackInfo &info);
  ~MetalClientWrapper();

  void Dispose(const Napi::CallbackInfo &info);
  void On(const Napi::CallbackInfo &info);
  void Off(const Napi::CallbackInfo &info);

  int GetUniqueId() {
    static std::atomic<int> next_id(1);
    return ++next_id;
  }

private:
  static Napi::FunctionReference constructor;

  SyphonMetalClient *m_client;
  id<MTLDevice> m_device;
  id<MTLCommandQueue> m_queue;
  FrameEventListener *m_frame_listener;
  TextureEventListener *m_texture_listener;
};
} // namespace syphon

#endif