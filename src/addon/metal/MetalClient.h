#ifndef ___METAL_CLIENT_H___
#define ___METAL_CLIENT_H___

#include <Foundation/Foundation.h>
#include <map>
#include <napi.h>
#include <utility>
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
  void ReleaseTexture(const Napi::CallbackInfo &info);

  unsigned long GetFrameCount() {
    static std::atomic<unsigned long> next_frame(1);
    return ++next_frame;
  }

private:
  static Napi::FunctionReference constructor;
  void CleanupTextures();

  SyphonMetalClient *m_client;
  id<MTLDevice> m_device;
  id<MTLCommandQueue> m_queue;
  FrameEventListener *m_frame_listener;

  TextureEventListener *m_texture_listener;
  std::map<unsigned long, id<MTLTexture>> m_textures;
};
} // namespace syphon

#endif