#include <stdio.h>
#include <iostream>

#include "MetalServer.h"

#import "../helpers/NodeSyphonHelpers.h"

using namespace syphon;

// #define SYPHON_CORE_SHARE 1

Napi::FunctionReference MetalServerWrapper::constructor;

/**
 * The SyphonMetalServer constructor.
 */
MetalServerWrapper::MetalServerWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<MetalServerWrapper>(info)
{


  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); // Means that env will be released after method returns.

  if (info.Length() != 1 || !info[0].IsString())
  {

    const char * err = "Please provide an unique name for the server.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();

  }

  // Try to instantiate the object with the provided CallbackInfo.
  // It's up to the wrapped class to throw an error we'll catch here.
  try {

    _first_check_passed = false;

    printf("Initialize Server with name '%s'.\n", TO_C_STRING(info[0]));

    _device = MTLCreateSystemDefaultDevice();
    _queue = [_device newCommandQueue];

    m_server = [[SyphonMetalServer alloc] initWithName:TO_NSSTRING(info[0]) device:_device options:nil];
    m_callbacks_count = 0;

  } catch (char const *err)
  {

    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();

  }

}

/**
 * The SyphonMetalServer destructor: will call Dispose on server and tear-down any resources associated.
 */
MetalServerWrapper::~MetalServerWrapper()
{
  printf("Syphon server destructor will call dispose.\n");
  _Dispose();
}

#pragma mark Static methods.

bool MetalServerWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}


#pragma mark Instance methods.

/**
 * Dealloc server and tear-down any resources associated.
 */
void MetalServerWrapper::Dispose(const Napi::CallbackInfo& info)
{
  printf("Syphon server dispose method will call dispose.\n");
  _Dispose();
}

void MetalServerWrapper::_Dispose() {

  printf("Syphon server will dispose.\n");

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
  
  if (!_first_check_passed) {

    if (info.Length() != 4) {
      Napi::TypeError::New(env, "Invalid number of parameters for 'publishImageData'").ThrowAsJavaScriptException();
    }
    
    if (!IS_UINT8_CLAMPED_ARRAY(info[0])) {
      Napi::TypeError::New(env, "1st parameter (data) must be an Uint8ClampedArray in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_RECT(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (imageRegion) must be a rectangle in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_NUMBER(info[2])) {
      Napi::TypeError::New(env, "3rd parameter (bytesPerRow) must be a number (unsigned integer) in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!info[3].IsBoolean()) {
      Napi::TypeError::New(env, "4th parameter (flipped) must be a boolean in 'publishImageData'").ThrowAsJavaScriptException();
    }

    _first_check_passed = true;

  }

  try {

    Napi::Object region = info[1].As<Napi::Object>();

    NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().Uint32Value(), region.Get("y").ToNumber().Uint32Value(), region.Get("width").ToNumber().Uint32Value(), region.Get("height").ToNumber().Uint32Value());
    NSUInteger bytesPerRow = info[2].As<Napi::Number>().ToNumber().Uint32Value();
    BOOL flipped = info[3].As<Napi::Boolean>().Value() == true ? YES : NO; // Is this conversion necessary?

    // See here: https://github.com/nodejs/node-addon-examples/blob/main/array_buffer_to_native/node-addon-api/array_buffer_to_native.cc
    Napi::ArrayBuffer buffer = info[0].As<Napi::TypedArrayOf<uint8_t>>().ArrayBuffer(); 

    MTLTextureDescriptor *descriptor = [MTLTextureDescriptor texture2DDescriptorWithPixelFormat: MTLPixelFormatRGBA8Unorm
                                                             width: (NSUInteger) imageRegion.size.width 
                                                             height: (NSUInteger) imageRegion.size.height
                                                             mipmapped: NO];

    _texture = [_device newTextureWithDescriptor: descriptor];
    [_texture replaceRegion: MTLRegionMake2D(imageRegion.origin.x, imageRegion.origin.y, imageRegion.size.width, imageRegion.size.height)
              mipmapLevel: 0
              withBytes: buffer.Data()
              bytesPerRow: bytesPerRow];

    id<MTLCommandBuffer> cmd = [_queue commandBuffer]; 
    
    [m_server publishFrameTexture: _texture
              onCommandBuffer: cmd
              imageRegion: imageRegion
              flipped: flipped];

    [cmd commit];

    auto channel_callbacks = MetalServerWrapper::m_listeners.find("message");

    if (channel_callbacks != MetalServerWrapper::m_listeners.end()) {

      std::vector<Napi::ThreadSafeFunction> callbacks = channel_callbacks->second;

      for (auto it = begin(callbacks); it != end(callbacks); ++it) {

        // Calls registered callback.

        Napi::String napiMessageString = info[1].As<Napi::String>();
        auto callback = [napiMessageString](Napi::Env env, Napi::Function js_callback) {
          js_callback.Call({napiMessageString});
        };

        it->NonBlockingCall(callback);

      }

    }

    // os_unfair_lock_unlock(&m_lock);

  } catch (char const *err)
  {

    Napi::Error::New(env, err).ThrowAsJavaScriptException();

  }

}

// Getters.

Napi::Value MetalServerWrapper::GetName(const Napi::CallbackInfo &info) 
{
  return Napi::String::New(info.Env(), [[m_server name] UTF8String]);
}

Napi::Value MetalServerWrapper::GetServerDescription(const Napi::CallbackInfo &info) 
{
  return [NodeSyphonHelpers serverDescription:[m_server serverDescription] info:info];
}

Napi::Value MetalServerWrapper::HasClients(const Napi::CallbackInfo &info) 
{
  return Napi::Boolean::New(info.Env(), [m_server hasClients]);
}

// Class definition.

Napi::Object MetalServerWrapper::Init(Napi::Env env, Napi::Object exports)
{

	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "MetalServer", {

    // Methods.

    InstanceMethod("publishImageData", &MetalServerWrapper::PublishImageData),
    // InstanceMethod("publishFrameTexture", &MetalServerWrapper::PublishFrameTexture),
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
