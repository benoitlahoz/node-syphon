#ifndef ___METAL_SERVER_H___
#define ___METAL_SERVER_H___

#include <napi.h>
#include <map>

#include <Foundation/Foundation.H>
#include <Cocoa/Cocoa.h>
#include <Metal/Metal.h>
#include <Syphon/Syphon.h>

#include "../helpers/macros.h"

namespace syphon
{

  class MetalServerWrapper : public Napi::ObjectWrap<MetalServerWrapper>
  {

  public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    MetalServerWrapper(const Napi::CallbackInfo &info);
    ~MetalServerWrapper();

    static bool HasInstance(Napi::Value value);

    void Dispose(const Napi::CallbackInfo &info);

    void PublishImageData(const Napi::CallbackInfo &info);
    // void PublishFrameTexture(const Napi::CallbackInfo &info);

    Napi::Value GetName(const Napi::CallbackInfo &info);
    Napi::Value GetServerDescription(const Napi::CallbackInfo &info);
    Napi::Value HasClients(const Napi::CallbackInfo &info);

    SyphonMetalServer * m_server;
  private:
    static Napi::FunctionReference constructor;

    bool m_first_check_passed;
    id<MTLDevice> m_device;
    id<MTLCommandQueue> m_queue;
    id<MTLTexture> m_texture;
  };
}

#endif