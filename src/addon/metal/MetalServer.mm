#include <stdio.h>
#include <iostream>

#include "MetalServer.h"

#import "../helpers/ServerDescriptionHelper.h"

using namespace syphon;

Napi::FunctionReference MetalServerWrapper::constructor;

MetalServerWrapper::MetalServerWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<MetalServerWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); 

  if (info.Length() != 1 || !info[0].IsString())
  {
    const char * err = "Please provide an unique name for the server.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  m_first_check_passed = false;

  m_device = MTLCreateSystemDefaultDevice();
  m_queue = [m_device newCommandQueue];

  m_server = [[SyphonMetalServer alloc] initWithName:TO_NSSTRING(info[0]) device:m_device options:nil];
}

MetalServerWrapper::~MetalServerWrapper()
{
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void MetalServerWrapper::Dispose(const Napi::CallbackInfo& info)
{
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void MetalServerWrapper::PublishImageData(const Napi::CallbackInfo& info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // Only test the parameters on first call: we suppose that the function will be called 
  // with same parameters, so we can avoid checking at each new frame.
  
  if (!m_first_check_passed) {

    if (info.Length() != 4) {
      Napi::TypeError::New(env, "publishImageData expects (Uint8ClampedArray, rect, size, bool)").ThrowAsJavaScriptException();
    }
    
    if (!IS_UINT8_CLAMPED_ARRAY(info[0])) {
      Napi::TypeError::New(env, "1st parameter (data) must be an Uint8ClampedArray in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_RECT(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (imageRegion) must be a rectangle in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_SIZE(info[2])) {
      Napi::TypeError::New(env, "3rd parameter (textureDimensions) must be a size in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!info[3].IsBoolean()) {
      Napi::TypeError::New(env, "4th parameter (flipped) must be a boolean in 'publishImageData'").ThrowAsJavaScriptException();
    }

    m_first_check_passed = true;
  }

    Napi::Object region = info[1].As<Napi::Object>();
    NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().Uint32Value(), region.Get("y").ToNumber().Uint32Value(), region.Get("width").ToNumber().Uint32Value(), region.Get("height").ToNumber().Uint32Value());
    
    Napi::Object size = info[2].As<Napi::Object>();
    NSSize texture_size = NSMakeSize(size.Get("width").ToNumber().FloatValue(), size.Get("height").ToNumber().FloatValue());
    NSUInteger bytesPerRow = NSUInteger(texture_size.width) * 4;
    
    BOOL flipped = info[3].As<Napi::Boolean>().Value() == true ? YES : NO; 

    Napi::ArrayBuffer buffer = info[0].As<Napi::TypedArrayOf<uint8_t>>().ArrayBuffer(); 

    MTLTextureDescriptor *descriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat: MTLPixelFormatRGBA8Unorm
                                                             width: (NSUInteger) texture_size.width 
                                                             height: (NSUInteger) texture_size.height
                                                             mipmapped: NO];

    m_texture = [m_device newTextureWithDescriptor: descriptor];
    [m_texture replaceRegion: MTLRegionMake2D(imageRegion.origin.x, imageRegion.origin.y, imageRegion.size.width, imageRegion.size.height)
              mipmapLevel: 0
              withBytes: buffer.Data()
              bytesPerRow: bytesPerRow];

    id<MTLCommandBuffer> cmd = [m_queue commandBuffer]; 
    
    [m_server publishFrameTexture: m_texture
              onCommandBuffer: cmd
              imageRegion: imageRegion
              flipped: flipped];

    // @RenaudRohlinger Should we add this?
    /*
    [cmd addCompletedHandler:^(__unused id<MTLCommandBuffer> cb) {
        [m_texture release];          // keep lifetime until GPU is done
    }];
    */
    [cmd commit];
}

void MetalServerWrapper::PublishSurfaceHandle(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    /* ──────────────────────────── Parameter checks (first call only) */
    if (!m_first_check_passed)
    {
        if (info.Length() != 4)
            Napi::TypeError::New(env,
              "'publishSurfaceHandle' expects (Buffer, rect, size, bool)")
              .ThrowAsJavaScriptException();

        if (!IS_BUFFER(info[0]))
            Napi::TypeError::New(env,
              "1st parameter (handle) must be a Buffer in 'publishSurfaceHandle'")
              .ThrowAsJavaScriptException();

        if (!IS_RECT(info[1]))
            Napi::TypeError::New(env,
              "2nd parameter (imageRegion) must be a rectangle in 'publishSurfaceHandle'").ThrowAsJavaScriptException();

        if (!IS_SIZE(info[2]))
            Napi::TypeError::New(env,
              "3rd parameter (textureDimensions) must be a size in 'publishSurfaceHandle'").ThrowAsJavaScriptException();

        if (!info[3].IsBoolean())
            Napi::TypeError::New(env,
              "4th parameter (flipped) must be a boolean in 'publishSurfaceHandle'").ThrowAsJavaScriptException();

        m_first_check_passed = true;
    }

    auto raw      = info[0].As<Napi::Buffer<void **>>();
    IOSurfaceRef ioSurface = *reinterpret_cast<IOSurfaceRef *>(raw.Data());

    Napi::Object regionObj = info[1].As<Napi::Object>();
    NSRect imageRegion = NSMakeRect(regionObj.Get("x"    ).ToNumber().DoubleValue(),
                                    regionObj.Get("y"    ).ToNumber().DoubleValue(),
                                    regionObj.Get("width").ToNumber().DoubleValue(),
                                    regionObj.Get("height").ToNumber().DoubleValue());

    Napi::Object sizeObj = info[2].As<Napi::Object>();
    NSSize textureDims = NSMakeSize(sizeObj.Get("width" ).ToNumber().DoubleValue(),
                                    sizeObj.Get("height").ToNumber().DoubleValue());

    BOOL flipped = info[3].As<Napi::Boolean>().Value() ? YES : NO;

    /* ──────────────────────────── Create an IOSurface-backed MTLTexture */
    const size_t width  = IOSurfaceGetWidth (ioSurface);
    const size_t height = IOSurfaceGetHeight(ioSurface);

    MTLTextureDescriptor *desc =
        [MTLTextureDescriptor texture2DDescriptorWithPixelFormat:MTLPixelFormatBGRA8Unorm
                                                           width:width
                                                          height:height
                                                       mipmapped:NO];
    desc.usage         = MTLTextureUsageShaderRead   |
                         MTLTextureUsageShaderWrite  |
                         MTLTextureUsageRenderTarget;
    desc.storageMode   = MTLStorageModeShared;         // IOSurface is shareable
    desc.resourceOptions = MTLResourceCPUCacheModeDefaultCache | MTLResourceStorageModeShared;

    id<MTLTexture> surfaceTexture =
        [m_device newTextureWithDescriptor:desc
                                  iosurface:ioSurface
                                      plane:0];
    if (!surfaceTexture)
    {
        Napi::Error::New(env, "Failed to create MTLTexture from IOSurface")
            .ThrowAsJavaScriptException();
        return;
    }

    /* ──────────────────────────── Publish to Syphon */
    id<MTLCommandBuffer> cmd = [m_queue commandBuffer];

    [m_server publishFrameTexture:surfaceTexture
                 onCommandBuffer:cmd
                     imageRegion:imageRegion
                         flipped:flipped];

    [cmd addCompletedHandler:^(__unused id<MTLCommandBuffer> cb) {
        [surfaceTexture release];          // keep lifetime until GPU is done
    }];
    [cmd commit];
}

Napi::Value MetalServerWrapper::GetName(const Napi::CallbackInfo &info) 
{
  return Napi::String::New(info.Env(), [[m_server name] UTF8String]);
}

Napi::Value MetalServerWrapper::GetServerDescription(const Napi::CallbackInfo &info) 
{
  return ServerDescriptionHelper::ToNapiObject([m_server serverDescription], info);
}

Napi::Value MetalServerWrapper::HasClients(const Napi::CallbackInfo &info) 
{
  return Napi::Boolean::New(info.Env(), [m_server hasClients]);
}

bool MetalServerWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object MetalServerWrapper::Init(Napi::Env env, Napi::Object exports)
{

	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "MetalServer", {

    // Methods.

    InstanceMethod("publishImageData", &MetalServerWrapper::PublishImageData),
    InstanceMethod("publishSurfaceHandle", &MetalServerWrapper::PublishSurfaceHandle),
    InstanceMethod("dispose", &MetalServerWrapper::Dispose),

    // Accessors.

    InstanceAccessor("name", &MetalServerWrapper::GetName, nullptr, napi_enumerable),
    InstanceAccessor("serverDescription", &MetalServerWrapper::GetServerDescription, nullptr, napi_enumerable),
    InstanceAccessor("hasClients", &MetalServerWrapper::HasClients, nullptr, napi_enumerable),    

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("MetalServer", func);

  return exports;

}
