#include <stdio.h>
#include <iostream>
#include <unistd.h>

#include "OpenGLClient.h"

#include "../helpers/NodeSyphonHelpers.h"
#include "../helpers/OpenGLContextHelper.h"
#include "../promises/PixelBufferPromiseWorker.h"

using namespace syphon;

Napi::FunctionReference OpenGLClientWrapper::constructor;

OpenGLClientWrapper::OpenGLClientWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<OpenGLClientWrapper>(info)
{

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); 

  m_client = NULL;
  m_width = 0;
  m_height = 0;

  if (info.Length() != 1 || !info[0].IsObject())
  {
    const char * err = "Please provide a server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  Napi::Object description = info[0].As<Napi::Object>();
  if (!IS_SERVER_DESCRIPTION(description)) {
    const char * err = "Unable to create SyphonOpenGLClient: Invalid server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  NSMutableDictionary *serverDescription = [[NSMutableDictionary alloc] init];

  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionAppNameKey];
  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionNameKey];
  [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionUUIDKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionUUIDKey];
  [serverDescription setObject:[NSNumber numberWithUnsignedInt:description.Get("SyphonServerDescriptionDictionaryVersionKey").As<Napi::Number>().Uint32Value()] forKey:@"SyphonServerDescriptionDictionaryVersionKey"];

  // TODO: Get from description itself.
  NSDictionary *surfaces = [NSDictionary dictionaryWithObjectsAndKeys: @"SyphonSurfaceTypeIOSurface", @"SyphonSurfaceType", nil];
  [serverDescription setObject:[NSArray arrayWithObject:surfaces] forKey:@"SyphonServerDescriptionSurfacesKey"];

  Napi::String appName = description.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>();

  if (CGLGetCurrentContext() == NULL) {
    CGLContextObj context = OpenGLContextHelper::Create(env);

    CGLError error_code;
    error_code = CGLSetCurrentContext(context);
    if (error_code > 0) {
      Napi::Error::New(env, CGLErrorString(error_code)).ThrowAsJavaScriptException();
    }
  }

  m_client = [[SyphonOpenGLClient alloc] initWithServerDescription: serverDescription // was [serverDescription copy]
                                                            context: CGLGetCurrentContext()
                                                            options: nil 
                                                            newFrameHandler: ^(SyphonOpenGLClient *client) {


      /*
      uint8_t * pixel_buffer = ReadPixels(client);
      SyphonOpenGLImage *frame = [client newFrameImage];
      m_width = [frame textureSize].width;
      m_height = [frame textureSize].height;
      */
      // this->m_pixel_buffer = ReadPixels(client);
  }];

  if (![m_client isValid]) {
    Napi::Error::New(env, "SyphonOpenGLClient is not valid.").ThrowAsJavaScriptException();
  }
}

/**
 * The SyphonOpenGLServer destructor: will call Dispose on server and tear-down any resources associated.
 */
OpenGLClientWrapper::~OpenGLClientWrapper()
{
  _Dispose();
}

#pragma mark Static methods.

bool OpenGLClientWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}


#pragma mark Instance methods.

/**
 * Explcitly dealloc server and tear-down any resources associated.
 */
void OpenGLClientWrapper::Dispose(const Napi::CallbackInfo& info)
{
  _Dispose();
}

// Can be called twice: once explicitly by the user then by the destructor.
void OpenGLClientWrapper::_Dispose() {
  if (m_client != NULL) {
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }
}

Napi::Value OpenGLClientWrapper::GetFrame(const Napi::CallbackInfo& info)
{

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  uint8_t* pixel_buffer = ReadPixels(m_client);

  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  PixelBufferPromiseWorker *worker = new PixelBufferPromiseWorker(deferred, pixel_buffer, m_width, m_height); // TODO: try with m_pixel_buffer st in block (works for a few frames).

  worker->SuppressDestruct();
  worker->Queue();  

  return deferred.Promise();
}

Napi::Value OpenGLClientWrapper::Width(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return Napi::Number::New(env, m_width);
}

Napi::Value OpenGLClientWrapper::Height(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return Napi::Number::New(env, m_height);
}

uint8_t * OpenGLClientWrapper::ReadPixels(SyphonOpenGLClient *client) {

  SyphonOpenGLImage *frame = [client newFrameImage];

  // Set current frame width and height.

  m_width = [frame textureSize].width;
  m_height = [frame textureSize].height;

  uint8_t* pixel_buffer = new uint8_t[m_width * m_height * 4];
  std::memset(pixel_buffer, 0, m_width * m_height * 4);

  GLuint fbo;

  CGLLockContext(CGLGetCurrentContext());
  
  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_RECTANGLE_EXT, [frame textureName], 0);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, [frame textureName]);

  glViewport(0, 0, m_width, m_height);
  glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
  // glClear(GL_COLOR_BUFFER_BIT); 

  glEnable(GL_TEXTURE_RECTANGLE_EXT);
  glDisable(GL_DEPTH_TEST);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, [frame textureName]);

  glBegin(GL_QUADS);
  
  glTexCoord2f(0.0f, 0.0f); glVertex2f(-1.0f, -1.0f);
  glTexCoord2f(m_width, 0.0f); glVertex2f(1.0f, -1.0f);
  glTexCoord2f(m_width, m_height); glVertex2f(1.0f, 1.0f);
  glTexCoord2f(0.0f, m_height); glVertex2f(-1.0f, 1.0f);

  glEnd();

  glReadPixels(0, 0, m_width, m_height, GL_RGBA, GL_UNSIGNED_BYTE, pixel_buffer);

  glBindTexture(GL_TEXTURE_RECTANGLE_EXT, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &fbo);

  [frame release];
  CGLUnlockContext(CGLGetCurrentContext());

  return pixel_buffer;
}

// Class definition.

Napi::Object OpenGLClientWrapper::Init(Napi::Env env, Napi::Object exports)
{

	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLClient", {

    // Methods.

    InstanceMethod("dispose", &OpenGLClientWrapper::Dispose),
    InstanceMethod("getFrame", &OpenGLClientWrapper::GetFrame),

    // Accessors.

    // InstanceAccessor("newFrame", &OpenGLClientWrapper::GetFrame, nullptr, napi_enumerable),
    InstanceAccessor("width", &OpenGLClientWrapper::Width, nullptr, napi_enumerable),
    InstanceAccessor("height", &OpenGLClientWrapper::Height, nullptr, napi_enumerable),

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLClient", func);

  return exports;

}
