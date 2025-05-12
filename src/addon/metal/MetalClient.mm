#include <iostream>
#include <stdio.h>
#include <unistd.h>

#include "MetalClient.h"

#import "../helpers/ServerDescriptionHelper.h"

using namespace syphon;

Napi::FunctionReference MetalClientWrapper::constructor;

MetalClientWrapper::MetalClientWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<MetalClientWrapper>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1 || !info[0].IsObject()) {
    const char *err = "Please provide a valid server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  Napi::Object description = info[0].As<Napi::Object>();

  if (!IS_SERVER_DESCRIPTION(description)) {
    const char *err = "Invalid server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
  NSDictionary *serverDescription =
      ServerDescriptionHelper::FromNapiObject(description);

  m_device = MTLCreateSystemDefaultDevice();
  m_queue = [m_device newCommandQueue];

  m_client = NULL;
  // Init listener to NULL until a first 'On' is called to bind a callback.
  m_frame_listener = NULL;
  m_texture_listener = NULL;

  m_client = [[SyphonMetalClient alloc]
      initWithServerDescription:serverDescription
                         device:m_device
                        options:nil
                newFrameHandler:^(SyphonMetalClient *client) {
                  if (client) {
                    id<MTLTexture> frame = client.newFrameImage;
                    NSUInteger width = frame.width;
                    NSUInteger height = frame.height;

                    if (m_frame_listener != NULL) {

                      MTLRegion region = MTLRegionMake2D(0, 0, width, height);

                      uint8_t *pixel_buffer = new uint8_t[width * height * 4];
                      std::memset(pixel_buffer, 0, width * height * 4);

                      [frame getBytes:pixel_buffer
                          bytesPerRow:4 * width
                           fromRegion:region
                          mipmapLevel:0];

                      // Convert from BGRA to RGBA: could have an option to do
                      // it or not.
                      vImage_Buffer buffer = {.height = height,
                                              .width = width,
                                              .rowBytes = width * 4,
                                              .data = pixel_buffer};
                      const uint8_t map[] = {2, 1, 0, 3};
                      vImagePermuteChannels_ARGB8888(&buffer, &buffer, map,
                                                     kvImageNoFlags);

                      m_frame_listener->Call((uint8_t *)buffer.data, width,
                                             height);
                    }

                    if (m_texture_listener != NULL) {
                      printf("Width: %lu, Height: %lu\n", width, height);
                      static const OSType kBGRA = 'BGRA';
                      NSDictionary *surfaceProps = @{
                        (__bridge NSString *)kIOSurfaceWidth : @(width),
                        (__bridge NSString *)kIOSurfaceHeight : @(height),
                        (__bridge NSString *)kIOSurfacePixelFormat : @(kBGRA),
                        (__bridge NSString *)kIOSurfaceBytesPerElement : @4,
                        (__bridge NSString *)
                        kIOSurfaceBytesPerRow : @(width * 4),
                        (__bridge NSString *)kIOSurfaceIsGlobal : @YES
                      };
                      IOSurfaceRef newSurf = IOSurfaceCreate(
                          (__bridge CFDictionaryRef)surfaceProps);

                      // Wrap the surface in a Metal texture
                      MTLTextureDescriptor *desc = [MTLTextureDescriptor
                          texture2DDescriptorWithPixelFormat:
                              MTLPixelFormatBGRA8Unorm
                                                       width:width
                                                      height:height
                                                   mipmapped:NO];
                      desc.usage = MTLTextureUsageShaderRead |
                                   MTLTextureUsageShaderWrite |
                                   MTLTextureUsageRenderTarget;
                      id<MTLTexture> dstTex =
                          [m_device newTextureWithDescriptor:desc
                                                   iosurface:newSurf
                                                       plane:0];

                      // blit copy
                      id<MTLCommandBuffer> cmd = [m_queue commandBuffer];
                      id<MTLBlitCommandEncoder> blit = [cmd blitCommandEncoder];
                      MTLOrigin origin = {0, 0, 0};
                      MTLSize size = {width, height, 1};
                      [blit copyFromTexture:frame
                                sourceSlice:0
                                sourceLevel:0
                               sourceOrigin:origin
                                 sourceSize:size
                                  toTexture:dstTex
                           destinationSlice:0
                           destinationLevel:0
                          destinationOrigin:origin];
                      [blit endEncoding];
                      [cmd commit];
                      [cmd waitUntilCompleted];

                      m_texture_listener->Call(
                          reinterpret_cast<uint8_t *>(newSurf), width, height);

                      NSLog(@"Id: %p %lu", dstTex,
                            MetalClientWrapper::GetUniqueId());

                      // TODO: we should pass a 'release' function to javascript
                      // to call this. Comment this line to have a huge memory
                      // leak without crash. :)
                      [dstTex release];

                      printf("Texture\n");
                    }

                    [frame release];
                  }
                }];

  [serverDescription release];

  if (![m_client isValid]) {
    Napi::Error::New(env, "SyphonMetalClient is not valid.")
        .ThrowAsJavaScriptException();
  }
}

MetalClientWrapper::~MetalClientWrapper() {
  // Object is automatically destroyed.

  if (m_frame_listener != NULL) {
    m_frame_listener->Dispose();
    m_frame_listener = NULL;
  }

  if (m_texture_listener != NULL) {
    m_texture_listener->Dispose();
    m_texture_listener = NULL;
  }

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void MetalClientWrapper::Dispose(const Napi::CallbackInfo &info) {
  // User explicitly called 'dispose'.

  if (m_frame_listener != NULL) {
    m_frame_listener->Dispose();
    m_frame_listener = NULL;
  }

  if (m_texture_listener != NULL) {
    m_texture_listener->Dispose();
    m_texture_listener = NULL;
  }

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void MetalClientWrapper::On(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 2) {
    Napi::TypeError::New(env, "Listener registration takes 2 arguments.")
        .ThrowAsJavaScriptException();
  }

  if (!(info[0].IsString())) {
    Napi::TypeError::New(env, "1st parameter of 'on' must be a string.")
        .ThrowAsJavaScriptException();
  }

  if (!(info[1].IsFunction())) {
    Napi::TypeError::New(env, "2nd parameter of 'on' must be a function.")
        .ThrowAsJavaScriptException();
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
  } else if (channel == "texture") {
    printf("Try...\n");
    if (m_texture_listener == NULL) {
      printf("Create...\n");
      // Create 'texture' listener.
      m_texture_listener = new TextureEventListener();
      printf("Created...\n");
    }
    // Will replace listener if any was already set.
    printf("Set...\n");
    m_texture_listener->Set(env, callback);
  } else {
    std::string err =
        "String '" + channel + "' is not a valid channel listener.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
}

void MetalClientWrapper::Off(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1) {
    Napi::TypeError::New(env, "Listener removal takes 1 arguments (channel).")
        .ThrowAsJavaScriptException();
  }

  if (!(info[0].IsString())) {
    Napi::TypeError::New(env, "1st parameter of 'off' must be a string.")
        .ThrowAsJavaScriptException();
  }

  std::string channel = info[0].As<Napi::String>().Utf8Value();

  if (channel == "frame") {
    // m_frame_listener = nullptr;
    m_frame_listener->Dispose();
  } else if (channel == "texture") {
    // m_frame_listener = nullptr;
    m_texture_listener->Dispose();
  } else {
    std::string err =
        "String '" + channel + "' is not a valid channel listener.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
}

#pragma mark NAPI methods.

bool MetalClientWrapper::HasInstance(Napi::Value value) {
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object MetalClientWrapper::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func =
      DefineClass(env, "OpenGLClient",
                  {
                      InstanceMethod("dispose", &MetalClientWrapper::Dispose),
                      InstanceMethod("on", &MetalClientWrapper::On),
                      InstanceMethod("off", &MetalClientWrapper::Off),
                  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("MetalClient", func);

  return exports;
}
