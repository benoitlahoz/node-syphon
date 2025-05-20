#include <chrono>
#include <iostream>
#include <stdio.h>
#include <unistd.h>
#include <execinfo.h>
#include <signal.h>

#include "MetalClient.h"

#import "../helpers/ServerDescriptionHelper.h"

using namespace syphon;

Napi::FunctionReference MetalClientWrapper::constructor;

static void sigHandler(int sig) {
  const char* sigName;
  switch (sig) {
    case SIGINT: sigName = "SIGINT"; break;
    case SIGSEGV: sigName = "SIGSEGV"; break;
    case SIGBUS: sigName = "SIGBUS"; break;
    case SIGTERM: sigName = "SIGTERM"; break;
    default: sigName = "UNKNOWN"; break;
  }
  printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageError\", \"NodeSyphonMessage\": \"Signal handler called: %s (%d)\"}\n", sigName, sig);
  void *callstack[64];
  int frames = backtrace(callstack, 64);
  char **strs = backtrace_symbols(callstack, frames);
  fprintf(stderr, "Stack backtrace (most recent call first):\n");
  for (int i = 0; i < frames; ++i) {
    fprintf(stderr, "%s\n", strs[i]);
  }
  free(strs);
  exit(1);
}

MetalClientWrapper::MetalClientWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<MetalClientWrapper>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  signal(SIGINT, sigHandler);
  signal(SIGSEGV, sigHandler);
  signal(SIGBUS, sigHandler);
  signal(SIGTERM, sigHandler);

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

  auto start = std::chrono::high_resolution_clock::now();

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

                      size_t bytesPerRow = width * 4;
                      size_t alignment   = 16;                        // Metal’s guaranteed minimum
                      bytesPerRow        = (bytesPerRow + alignment-1) & ~(alignment-1);

                      static const OSType kBGRA = 'BGRA';
                      NSDictionary *surfaceProps = @{
                        (__bridge NSString *)kIOSurfaceWidth : @(width),
                        (__bridge NSString *)kIOSurfaceHeight : @(height),
                        (__bridge NSString *)kIOSurfacePixelFormat : @(kBGRA),
                        (__bridge NSString *)kIOSurfaceBytesPerElement : @4,
                        (__bridge NSString *)kIOSurfaceBytesPerRow : @(bytesPerRow),
                        (__bridge NSString *)kIOSurfaceIsGlobal : @YES
                      };
                      IOSurfaceRef new_surface = IOSurfaceCreate(
                          (__bridge CFDictionaryRef)surfaceProps);

                      if (!new_surface) {
                        NSLog(@"[MetalClient] IOSurfaceCreate failed (%zu×%zu)", width, height);
                        return;
                      }

                      // Wrap the surface in a Metal texture
                      MTLTextureDescriptor *desc = [MTLTextureDescriptor
                          texture2DDescriptorWithPixelFormat:
                              MTLPixelFormatBGRA8Unorm
                                                       width:width
                                                      height:height
                                                   mipmapped:NO];

                      desc.storageMode = MTLStorageModeShared;
                      desc.usage = MTLTextureUsageShaderRead |
                                   MTLTextureUsageShaderWrite |
                                   MTLTextureUsageRenderTarget;

                      id<MTLTexture> dst_tex =
                          [m_device newTextureWithDescriptor:desc
                                                   iosurface:new_surface
                                                       plane:0];

                      // Blit copy
                      id<MTLCommandBuffer> cmd = [m_queue commandBuffer];
                      id<MTLBlitCommandEncoder> blit = [cmd blitCommandEncoder];
                      MTLOrigin origin = {0, 0, 0};
                      MTLSize size = {width, height, 1};
                      [blit copyFromTexture:frame
                                sourceSlice:0
                                sourceLevel:0
                               sourceOrigin:origin
                                 sourceSize:size
                                  toTexture:dst_tex
                           destinationSlice:0
                           destinationLevel:0
                          destinationOrigin:origin];
                      [blit endEncoding];
                      [cmd commit];
                      [cmd waitUntilCompleted];

                      unsigned long frame_count =
                          MetalClientWrapper::GetFrameCount();

                      auto elapsed =
                          std::chrono::high_resolution_clock::now() - start;
                      long long time_elapsed =
                          std::chrono::duration_cast<std::chrono::microseconds>(
                              elapsed)
                              .count();

                      m_texture_listener->Call(
                          reinterpret_cast<uint8_t *>(new_surface), width,
                          height, "bgra", frame_count, time_elapsed);

                      // Keep a reference to the texture, to be released later
                      // with `ReleaseTexture`.
                      m_textures[frame_count] = dst_tex;
                      if (new_surface) {
                        // The dst_tex (Metal texture) now holds its own reference to the IOSurface.
                        CFRelease(new_surface); // Release your ownership of new_surface
                      }
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
  CleanupTextures();

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
  CleanupTextures();

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
    if (m_texture_listener == NULL) {
      // Create 'texture' listener.
      m_texture_listener = new TextureEventListener();
    }
    // Will replace listener if any was already set.
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
    m_frame_listener->Dispose();
  } else if (channel == "texture") {
    m_texture_listener->Dispose();
  } else {
    std::string err =
        "String '" + channel + "' is not a valid channel listener.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }
}

void MetalClientWrapper::ReleaseTexture(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1) {
    Napi::TypeError::New(env, "Texture release takes 1 arguments (id).")
        .ThrowAsJavaScriptException();
  }

  if (!(info[0].IsNumber())) {
    Napi::TypeError::New(env,
                         "1st parameter of 'release' (id) must be a number.")
        .ThrowAsJavaScriptException();
  }

  unsigned long frame_number = info[0].As<Napi::Number>().Uint32Value();

  auto it = m_textures.find(frame_number);
  if (it != m_textures.end()) {
    id<MTLTexture> texture = it->second;
    [texture release];
    m_textures.erase(it);
  }
}

void MetalClientWrapper::CleanupTextures() {
  // Ensures any textures not yet released by JavaScript calls are cleaned up.
  for (auto const& pair_entry : m_textures) {
    id<MTLTexture> texture_to_release = pair_entry.second;
    if (texture_to_release != nil) {
      [texture_to_release release]; // Releases the MTLTexture, which in turn should release its IOSurface
    }
  }
  m_textures.clear();
}


#pragma mark NAPI methods.

bool MetalClientWrapper::HasInstance(Napi::Value value) {
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object MetalClientWrapper::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(
      env, "MetalClient",
      {
          InstanceMethod("dispose", &MetalClientWrapper::Dispose),
          InstanceMethod("on", &MetalClientWrapper::On),
          InstanceMethod("off", &MetalClientWrapper::Off),
          InstanceMethod("releaseTexture", &MetalClientWrapper::ReleaseTexture),
      });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("MetalClient", func);

  return exports;
}
