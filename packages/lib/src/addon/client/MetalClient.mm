#include <stdio.h>
#include <iostream>
#include <unistd.h>

#include "MetalClient.h"

#include "../helpers/NodeSyphonHelpers.h"
#include "../opengl/OpenGLHelper.h"

using namespace syphon;

Napi::FunctionReference MetalClientWrapper::constructor;

MetalClientWrapper::MetalClientWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<MetalClientWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); 

  if (info.Length() != 1 || !info[0].IsObject())
  {
    const char * err = "Please provide a valid server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  Napi::Object description = info[0].As<Napi::Object>();
  if (!IS_SERVER_DESCRIPTION(description)) {
    const char * err = "Invalid server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  m_client = NULL;

  NSMutableDictionary *serverDescription = [[NSMutableDictionary alloc] init];

  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionAppNameKey];
  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionNameKey];
  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionUUIDKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionUUIDKey];
  [serverDescription setObject:[NSNumber numberWithUnsignedInt:description.Get("SyphonServerDescriptionDictionaryVersionKey").As<Napi::Number>().Uint32Value()] forKey:@"SyphonServerDescriptionDictionaryVersionKey"];

  // TODO: Get from description itself.
  NSDictionary *surfaces = [NSDictionary dictionaryWithObjectsAndKeys: @"SyphonSurfaceTypeIOSurface", @"SyphonSurfaceType", nil];
  [serverDescription setObject:[NSArray arrayWithObject:surfaces] forKey:@"SyphonServerDescriptionSurfacesKey"];

  m_device =  MTLCreateSystemDefaultDevice();
  m_queue = [m_device newCommandQueue];

  // Init listener to NULL until a first 'On' is called to bind a callback.
  m_frame_listener = NULL;

  m_client = [[SyphonMetalClient alloc] initWithServerDescription: [serverDescription copy]
                                                           device: m_device
                                                          options: nil 
                                                  newFrameHandler: ^(SyphonMetalClient *client) {


    if (client) {
      id<MTLTexture> frame = client.newFrameImage;
      NSUInteger width = frame.width;
      NSUInteger height = frame.height;
      MTLRegion region = MTLRegionMake2D(0, 0, width, height);

      uint8_t * pixel_buffer = new uint8_t[width * height * 4];
      std::memset(pixel_buffer, 0, width * height * 4);

      [frame getBytes: pixel_buffer
          bytesPerRow: 4 * width
           fromRegion: region
          mipmapLevel: 0];

      // Convert from BGRA to RGBA: could have an option to do it or not.
      vImage_Buffer buffer = { .height = height, .width = width, .rowBytes = width * 4, .data = pixel_buffer };
      const uint8_t map[] = { 2, 1, 0, 3 };
      vImagePermuteChannels_ARGB8888(&buffer, &buffer, map, kvImageNoFlags);
      
      m_frame_listener->Call((uint8_t *)buffer.data, width, height);

      [frame release];
    }
        
  }];

  if (![m_client isValid]) {
    Napi::Error::New(env, "SyphonMetalClient is not valid.").ThrowAsJavaScriptException();
  }
}

MetalClientWrapper::~MetalClientWrapper()
{
  // Object is automatically destroyed.

  m_frame_listener->Dispose();

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void MetalClientWrapper::Dispose(const Napi::CallbackInfo& info)
{
  // User explicitly called 'dispose'.

  m_frame_listener->Dispose();

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void MetalClientWrapper::On(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 2) {
      Napi::TypeError::New(env, "Listener registration takes 2 arguments.").ThrowAsJavaScriptException();
    }
    
  if (!(info[0].IsString())) {
    Napi::TypeError::New(env, "1st parameter of 'on' must be a string.").ThrowAsJavaScriptException();
  }

  if (!(info[1].IsFunction())) {
    Napi::TypeError::New(env, "2nd parameter of 'on' must be a function.").ThrowAsJavaScriptException();
  }

  std::string channel = info[0].As<Napi::String>().Utf8Value();
  Napi::Function callback = info[1].As<Napi::Function>();

  if (channel == "frame") {
    if (m_frame_listener == NULL) {
      // Create 'frame' listener.
      m_frame_listener = new FrameEventListener();
    }
    // Will replace listener if any was already set.
    
    m_frame_listener->Set(env, callback);
  } else {
    std::string err = "String '" + channel + "' is not a valid channel listener.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
}

void MetalClientWrapper::Off(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1) {
      Napi::TypeError::New(env, "Listener removel takes 1 arguments (channel).").ThrowAsJavaScriptException();
    }
    
  if (!(info[0].IsString())) {
    Napi::TypeError::New(env, "1st parameter of 'off' must be a string.").ThrowAsJavaScriptException();
  }

  std::string channel = info[0].As<Napi::String>().Utf8Value();

  if (channel == "frame") {
    // m_frame_listener = nullptr;
    m_frame_listener->Dispose();
  } else {
    std::string err = "String '" + channel + "' is not a valid channel listener.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
}

#pragma mark NAPI methods.

bool MetalClientWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object MetalClientWrapper::Init(Napi::Env env, Napi::Object exports)
{
	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLClient", {
    InstanceMethod("dispose", &MetalClientWrapper::Dispose),
    InstanceMethod("on", &MetalClientWrapper::On),
    InstanceMethod("off", &MetalClientWrapper::Off),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("MetalClient", func);

  return exports;

}
