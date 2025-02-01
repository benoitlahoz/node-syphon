#include <stdio.h>
#include <iostream>

#include "OpenGLServer.h"

#import "../helpers/ServerDescriptionHelper.h"
#include "../helpers/OpenGLHelper.h"

using namespace syphon;

Napi::FunctionReference OpenGLServerWrapper::constructor;

OpenGLServerWrapper::OpenGLServerWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<OpenGLServerWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); 

  if (info.Length() != 1 || !info[0].IsString())
  {
    const char * err = "Please provide an unique name for the server.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  m_first_check_passed = false;
  m_texture = 0;

  // Bootstrap a context for Syphon server.
  CGLContextObj cgl_ctx = OpenGLHelper::CreateContext(env);
  m_server = [[SyphonOpenGLServer alloc] initWithName:TO_NSSTRING(info[0]) context:cgl_ctx options:nil];
}

OpenGLServerWrapper::~OpenGLServerWrapper()
{
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void OpenGLServerWrapper::Dispose(const Napi::CallbackInfo& info)
{
  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
}

void OpenGLServerWrapper::PublishImageData(const Napi::CallbackInfo& info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // Only test the parameters on first call: we suppose that the function will be called 
  // with same parameters, so we can avoid checking at each new frame.
  
  if (!m_first_check_passed) {
    if (info.Length() != 5) {
      Napi::TypeError::New(env, "Invalid number of parameters for 'publishImageData'").ThrowAsJavaScriptException();
    }
    
    if (!IS_UINT8_CLAMPED_ARRAY(info[0])) {
      Napi::TypeError::New(env, "1st parameter (data) must be an Uint8ClampedArray in 'publishImageData'").ThrowAsJavaScriptException();
    }
    
    if (!IS_TEXTURE_TARGET(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (texture_target) must be a string containing GL_TEXTURE_RECTANGLE_EXT or GL_TEXTURE_2D in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_RECT(info[2])) {
      Napi::TypeError::New(env, "3rd parameter (imageRegion) must be a rectangle in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!IS_SIZE(info[3])) {
      Napi::TypeError::New(env, "4th parameter (textureDimension) must be a size in 'publishImageData'").ThrowAsJavaScriptException();
    }

    if (!info[4].IsBoolean()) {
      Napi::TypeError::New(env, "5th parameter (flipped) must be a boolean in 'publishImageData'").ThrowAsJavaScriptException();
    }

    m_first_check_passed = true;
  }

  std::string targetString = info[1].As<Napi::String>().Utf8Value();
  GLenum texture_target = targetString == "GL_TEXTURE_RECTANGLE_EXT" ? GL_TEXTURE_RECTANGLE_EXT : GL_TEXTURE_2D;

  Napi::Object region = info[2].As<Napi::Object>();
  NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().FloatValue(), region.Get("y").ToNumber().FloatValue(), region.Get("width").ToNumber().FloatValue(), region.Get("height").ToNumber().FloatValue());
  
  Napi::Object size = info[3].As<Napi::Object>();
  NSSize texture_size = NSMakeSize(size.Get("width").ToNumber().FloatValue(), size.Get("height").ToNumber().FloatValue());

  BOOL flipped = info[4].As<Napi::Boolean>().Value() == true ? YES : NO;

  Napi::ArrayBuffer buffer = info[0].As<Napi::TypedArrayOf<uint8_t>>().ArrayBuffer(); 

  CGLSetCurrentContext([m_server context]);

  CGLLockContext(CGLGetCurrentContext());
  glGenTextures(1,& m_texture);  

  OpenGLHelper::Uint8ToTexture(
    texture_target, 
    m_texture,
    (size_t) texture_size.width, 
    (size_t) texture_size.height,
    (uint8_t *) buffer.Data()
  );

  [m_server publishFrameTexture: m_texture 
                  textureTarget: texture_target 
                    imageRegion: imageRegion 
              textureDimensions: texture_size 
                        flipped: flipped
  ];

  glDeleteTextures(1, &m_texture);
  CGLSetCurrentContext(NULL);
}

Napi::Value OpenGLServerWrapper::GetName(const Napi::CallbackInfo &info) 
{
  return Napi::String::New(info.Env(), [[m_server name] UTF8String]);
}

Napi::Value OpenGLServerWrapper::GetServerDescription(const Napi::CallbackInfo &info) 
{
  return ServerDescriptionHelper::ToNapiObject([m_server serverDescription], info);
}

Napi::Value OpenGLServerWrapper::HasClients(const Napi::CallbackInfo &info) 
{
  return Napi::Boolean::New(info.Env(), [m_server hasClients]);
}

#pragma mark NAPI methods.

bool OpenGLServerWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object OpenGLServerWrapper::Init(Napi::Env env, Napi::Object exports)
{
	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLServer", {

    // Methods.

    InstanceMethod("publishImageData", &OpenGLServerWrapper::PublishImageData),
    // InstanceMethod("publishFrameTexture", &OpenGLServerWrapper::PublishFrameTexture),
    InstanceMethod("dispose", &OpenGLServerWrapper::Dispose),

    InstanceAccessor("name", &OpenGLServerWrapper::GetName, nullptr, napi_enumerable),
    InstanceAccessor("serverDescription", &OpenGLServerWrapper::GetServerDescription, nullptr, napi_enumerable),
    InstanceAccessor("hasClients", &OpenGLServerWrapper::HasClients, nullptr, napi_enumerable),    

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLServer", func);

  return exports;
}
