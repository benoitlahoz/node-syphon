#include <iostream>
#include <stdio.h>

#include "OpenGLHelper.h"
#include "OpenGLServer.h"

#import "../helpers/ServerDescriptionHelper.h"

using namespace syphon;

Napi::FunctionReference OpenGLServerWrapper::constructor;

OpenGLServerWrapper::OpenGLServerWrapper(const Napi::CallbackInfo &info)
    : Napi::ObjectWrap<OpenGLServerWrapper>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1 || !info[0].IsString()) {
    const char *err = "Please provide an unique name for the server.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  m_first_check_passed = false;
  m_texture = 0;

  // Bootstrap a context for Syphon server.
  CGLContextObj cgl_ctx = OpenGLHelper::CreateContext(env);
  m_server = [[SyphonOpenGLServer alloc] initWithName:TO_NSSTRING(info[0])
                                              context:cgl_ctx
                                              options:nil];
}

OpenGLServerWrapper::~OpenGLServerWrapper() {
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void OpenGLServerWrapper::Dispose(const Napi::CallbackInfo &info) {
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void OpenGLServerWrapper::PublishImageData(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // Only test the parameters on first call: we suppose that the function will
  // be called with same parameters, so we can avoid checking at each new frame.

  if (!m_first_check_passed) {
    if (info.Length() != 5) {
      Napi::TypeError::New(
          env, "Invalid number of parameters for 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_UINT8_CLAMPED_ARRAY(info[0])) {
      Napi::TypeError::New(env, "1st parameter (data) must be an "
                                "Uint8ClampedArray in 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_RECT(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (imageRegion) must be a "
                                "rectangle in 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_SIZE(info[2])) {
      Napi::TypeError::New(env, "3rd parameter (textureDimension) must be a "
                                "size in 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    if (!info[3].IsBoolean()) {
      Napi::TypeError::New(
          env,
          "4th parameter (flipped) must be a boolean in 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_TEXTURE_TARGET(info[4])) {
      Napi::TypeError::New(
          env,
          "5th parameter (textureTarget) must be a string containing "
          "GL_TEXTURE_RECTANGLE_EXT or GL_TEXTURE_2D in 'publishImageData'")
          .ThrowAsJavaScriptException();
    }

    m_first_check_passed = true;
  }

  std::string targetString = info[4].As<Napi::String>().Utf8Value();
  GLenum texture_target = targetString == "GL_TEXTURE_RECTANGLE_EXT"
                              ? GL_TEXTURE_RECTANGLE_EXT
                              : GL_TEXTURE_2D;

  Napi::Object region = info[1].As<Napi::Object>();
  NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().FloatValue(),
                                  region.Get("y").ToNumber().FloatValue(),
                                  region.Get("width").ToNumber().FloatValue(),
                                  region.Get("height").ToNumber().FloatValue());

  Napi::Object size = info[2].As<Napi::Object>();
  NSSize texture_size = NSMakeSize(size.Get("width").ToNumber().FloatValue(),
                                   size.Get("height").ToNumber().FloatValue());

  BOOL flipped = info[3].As<Napi::Boolean>().Value() == true ? YES : NO;

  Napi::ArrayBuffer buffer =
      info[0].As<Napi::TypedArrayOf<uint8_t>>().ArrayBuffer();

  CGLSetCurrentContext([m_server context]);

  CGLLockContext(CGLGetCurrentContext());
  glGenTextures(1, &m_texture);

  OpenGLHelper::Uint8ToTexture(
      texture_target, m_texture, (size_t)texture_size.width,
      (size_t)texture_size.height, (uint8_t *)buffer.Data());

  [m_server publishFrameTexture:m_texture
                  textureTarget:texture_target
                    imageRegion:imageRegion
              textureDimensions:texture_size
                        flipped:flipped];

  glDeleteTextures(1, &m_texture);
  CGLSetCurrentContext(NULL);
}

void OpenGLServerWrapper::PublishSurfacehandle(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // Only test the parameters on first call: we suppose that the function will
  // be called with same parameters, so we can avoid checking at each new frame.

  if (!m_first_check_passed) {
    if (info.Length() != 5) {
      Napi::TypeError::New(
          env, "Invalid number of parameters for 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_BUFFER(info[0])) {
      Napi::TypeError::New(
          env,
          "1st parameter (handle) must be a Buffer in 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_RECT(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (imageRegion) must be a "
                                "rectangle in 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_SIZE(info[2])) {
      Napi::TypeError::New(env, "3rd parameter (textureDimension) must be a "
                                "size in 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    if (!info[3].IsBoolean()) {
      Napi::TypeError::New(
          env,
          "4th parameter (flipped) must be a boolean in 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    if (!IS_TEXTURE_TARGET(info[4])) {
      Napi::TypeError::New(
          env,
          "5th2nd parameter (textureTarget) must be a string containing "
          "GL_TEXTURE_RECTANGLE_EXT or GL_TEXTURE_2D in 'publishSurfaceHandle'")
          .ThrowAsJavaScriptException();
    }

    m_first_check_passed = true;
  }

  // TODO: In a Promise (sequential?), since we can't use a worker on JS side
  // (handle buffer is cloned).

  std::string targetString = info[4].As<Napi::String>().Utf8Value();
  GLenum texture_target = targetString == "GL_TEXTURE_RECTANGLE_EXT"
                              ? GL_TEXTURE_RECTANGLE_EXT
                              : GL_TEXTURE_2D;

  Napi::Object region = info[1].As<Napi::Object>();
  NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().FloatValue(),
                                  region.Get("y").ToNumber().FloatValue(),
                                  region.Get("width").ToNumber().FloatValue(),
                                  region.Get("height").ToNumber().FloatValue());

  Napi::Object size = info[2].As<Napi::Object>();
  NSSize texture_size = NSMakeSize(size.Get("width").ToNumber().FloatValue(),
                                   size.Get("height").ToNumber().FloatValue());

  BOOL flipped = info[3].As<Napi::Boolean>().Value() == true ? YES : NO;

  auto buffer = info[0].As<Napi::Buffer<void **>>();

  IOSurfaceRef io_surface = *reinterpret_cast<IOSurfaceRef *>(buffer.Data());
  GLsizei width = (GLsizei)IOSurfaceGetWidth(io_surface);
  GLsizei height = (GLsizei)IOSurfaceGetHeight(io_surface);

  CGLSetCurrentContext([m_server context]);
  CGLLockContext(CGLGetCurrentContext());

  glGenTextures(1, &m_texture);
  glEnable(GL_TEXTURE_RECTANGLE_ARB);
  glBindTexture(GL_TEXTURE_RECTANGLE_ARB, m_texture);

  CGLTexImageIOSurface2D(CGLGetCurrentContext(), GL_TEXTURE_RECTANGLE_ARB,
                         GL_RGBA8, width, height, GL_BGRA,
                         GL_UNSIGNED_INT_8_8_8_8_REV, io_surface, 0);

  glTexParameteri(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_RECTANGLE_ARB, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glBindTexture(GL_TEXTURE_RECTANGLE_ARB, 0);

  [m_server publishFrameTexture:m_texture
                  textureTarget:texture_target
                    imageRegion:imageRegion
              textureDimensions:texture_size
                        flipped:flipped];

  glDeleteTextures(1, &m_texture);
  CGLUnlockContext(CGLGetCurrentContext());
  CGLSetCurrentContext(NULL);

  /*
  // TODO: Add to helpers.
  CGLError cglError =
  CGLTexImageIOSurface2D(CGLGetCurrentContext(), GL_TEXTURE_RECTANGLE_EXT,
  GL_RGBA, (GLsizei)surface_w, (GLsizei)surface_h, GL_BGRA,
  GL_UNSIGNED_INT_8_8_8_8_REV, surface, 0); if (cglError != kCGLNoError) { if
  (cglError == kCGLBadAttribute) { printf("Bad attribute.\n"); } else if
  (cglError == kCGLBadProperty) { printf("Bad prop.\n"); } else if (cglError ==
  kCGLBadPixelFormat) { printf("Bad pixel.\n"); } else if (cglError ==
  kCGLBadRendererInfo) { printf("Bad renderer.\n"); } else if (cglError ==
  kCGLBadContext) { printf("Bad context.\n"); } else if (cglError ==
  kCGLBadDrawable) { printf("Bad drawable.\n"); } else if (cglError ==
  kCGLBadDisplay) { printf("Bad display.\n"); } else if (cglError ==
  kCGLBadState) { printf("Bad state.\n"); } else if (cglError == kCGLBadValue) {
      printf("Bad value.\n");
    } else if (cglError == kCGLBadMatch) {
      printf("Bad match.\n");
    } else if (cglError == kCGLBadEnumeration) {
      printf("Bad enum.\n");
    } else if (cglError == kCGLBadOffScreen) {
      printf("Bad offscreen.\n");
    } else if (cglError == kCGLBadFullScreen) {
      printf("Bad fullscreen.\n");
    } else if (cglError == kCGLBadWindow) {
      printf("Bad window.\n");
    } else if (cglError == kCGLBadAddress) {
      printf("Bad address.\n");
    } else if (cglError == kCGLBadCodeModule) {
      printf("Bad code module.\n");
    } else if (cglError == kCGLBadAlloc) {
      printf("Bad alloc.\n");
    } else if (cglError == kCGLBadConnection) {
      printf("Bad connection.\n");
    }
  }
  */

  // TODO: For client see 'Direct surface publishing' here:
  // https://github.com/Syphon/Syphon-Framework/pull/96
}

Napi::Value OpenGLServerWrapper::GetName(const Napi::CallbackInfo &info) {
  return Napi::String::New(info.Env(), [[m_server name] UTF8String]);
}

Napi::Value
OpenGLServerWrapper::GetServerDescription(const Napi::CallbackInfo &info) {
  return ServerDescriptionHelper::ToNapiObject([m_server serverDescription],
                                               info);
}

Napi::Value OpenGLServerWrapper::HasClients(const Napi::CallbackInfo &info) {
  return Napi::Boolean::New(info.Env(), [m_server hasClients]);
}

#pragma mark NAPI methods.

bool OpenGLServerWrapper::HasInstance(Napi::Value value) {
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object OpenGLServerWrapper::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(
      env, "OpenGLServer",
      {

          // Methods.

          InstanceMethod("publishImageData",
                         &OpenGLServerWrapper::PublishImageData),
          InstanceMethod("publishSurfaceHandle",
                         &OpenGLServerWrapper::PublishSurfacehandle),
          InstanceMethod("dispose", &OpenGLServerWrapper::Dispose),

          InstanceAccessor("name", &OpenGLServerWrapper::GetName, nullptr,
                           napi_enumerable),
          InstanceAccessor("serverDescription",
                           &OpenGLServerWrapper::GetServerDescription, nullptr,
                           napi_enumerable),
          InstanceAccessor("hasClients", &OpenGLServerWrapper::HasClients,
                           nullptr, napi_enumerable),

      });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLServer", func);

  return exports;
}
