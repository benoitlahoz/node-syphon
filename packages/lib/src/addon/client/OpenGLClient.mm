#include <stdio.h>
#include <iostream>
#include <unistd.h>

#include "OpenGLClient.h"

#include "../helpers/NodeSyphonHelpers.h"
#include "../opengl/OpenGLHelper.h"

using namespace syphon;

Napi::FunctionReference OpenGLClientWrapper::constructor;

OpenGLClientWrapper::OpenGLClientWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<OpenGLClientWrapper>(info)
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

  // Bootstrap a context for Syphon client.
  CGLContextObj cgl_ctx = OpenGLHelper::CreateContext(env);

  // Init listener to NULL until a first 'On' is called to bind a callback.
  m_frame_listener = NULL;

  m_client = [[SyphonOpenGLClient alloc] initWithServerDescription: [serverDescription copy]
                                                            context: cgl_ctx
                                                            options: nil 
                                                            newFrameHandler: ^(SyphonOpenGLClient *client) {


    if (client) {
      CGLContextObj ctx = client.context;
      CGLSetCurrentContext(ctx);

      SyphonOpenGLImage * frame = client.newFrameImage;

      GLuint texture = frame.textureName;
      size_t width = frame.textureSize.width;
      size_t height = frame.textureSize.height;

      uint8_t * pixel_buffer = OpenGLHelper::TextureToUint8(texture, width, height);

      m_frame_listener->Call(pixel_buffer, width, height);

      [frame release];

      CGLSetCurrentContext(NULL);
    }
        
  }];

  if (![m_client isValid]) {
    Napi::Error::New(env, "SyphonOpenGLClient is not valid.").ThrowAsJavaScriptException();
  }
}

OpenGLClientWrapper::~OpenGLClientWrapper()
{
  // Object is automatically destroyed.

  m_frame_listener->Dispose();

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void OpenGLClientWrapper::Dispose(const Napi::CallbackInfo& info)
{
  // User explicitly called 'dispose'.

  m_frame_listener->Dispose();

  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

void OpenGLClientWrapper::On(const Napi::CallbackInfo &info)
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

void OpenGLClientWrapper::Off(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 1) {
      Napi::TypeError::New(env, "Listener removal takes 1 arguments (channel).").ThrowAsJavaScriptException();
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

bool OpenGLClientWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}

Napi::Object OpenGLClientWrapper::Init(Napi::Env env, Napi::Object exports)
{
	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLClient", {
    InstanceMethod("dispose", &OpenGLClientWrapper::Dispose),
    InstanceMethod("on", &OpenGLClientWrapper::On),
    InstanceMethod("off", &OpenGLClientWrapper::Off),
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLClient", func);

  return exports;

}
