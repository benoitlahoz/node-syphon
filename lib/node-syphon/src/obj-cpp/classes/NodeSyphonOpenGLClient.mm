#include <stdio.h>
#include <iostream>
#include <unistd.h>

#include "NodeSyphonOpenGLClient.h"

#include "../helpers/NodeSyphonHelpers.h"
#include "./NodeSyphonFramePromiseWorker.h"

using namespace syphon;


Napi::FunctionReference SyphonOpenGLClientWrapper::constructor;

/**
 * The SyphonOpenGLServer constructor.
 */
SyphonOpenGLClientWrapper::SyphonOpenGLClientWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<SyphonOpenGLClientWrapper>(info)
{


  Napi::Env env = info.Env();
  Napi::HandleScope scope(env); // Means that env will be released after method returns.
  // Napi::EscapableHandleScope scope(env);

  // Napi::EscapableHandleScope m_escapableScope(env, scope);

  m_client = NULL;
  m_width = 0;
  m_height = 0;

  if (info.Length() != 1 || !info[0].IsObject())
  {
    const char * err = "Please provide a server description.";
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

  /*
  Napi::ThreadSafeFunction callback;
  if (info.Length() == 2 && info[1].IsFunction())
  {
     Napi::Function jsCallback = info[1].As<Napi::Function>();
    callback = Napi::ThreadSafeFunction::New(env, jsCallback, "Callback", 0, 1);
  }
  */

  // Try to instantiate the object with the provided CallbackInfo.
  // It's up to the wrapped class to throw an error we'll catch here.
  try {

    Napi::Object description = info[0].As<Napi::Object>();

    if (!description.Has("SyphonServerDescriptionAppNameKey") || 
        !description.Has("SyphonServerDescriptionNameKey") || 
        !description.Has("SyphonServerDescriptionUUIDKey") || 
        !description.Has("SyphonServerDescriptionDictionaryVersionKey") ||
        !description.Has("SyphonServerDescriptionSurfacesKey")) {
      const char * err = "Unable to create SyphonOpenGLClient: Invalid server description.";
      Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
    }

    NSMutableDictionary *serverDescription = [[NSMutableDictionary alloc] init];
    
    /*
    for (const auto& e : description) {
      // printf("KEY %s\n", static_cast<Napi::Value>(e.first).As<Napi::String>().Utf8Value().c_str());
      // printf("VALUE %s\n", static_cast<Napi::Value>(e.second).As<Napi::String>().Utf8Value().c_str());
      // sum += static_cast<Value>(e.second).As<Number>().Int64Value();
      [serverDescription setObject:[NSString stringWithUTF8String:static_cast<Napi::Value>(e.second).As<Napi::String>().Utf8Value().c_str()] 
                            forKey:[NSString stringWithUTF8String:static_cast<Napi::Value>(e.first).As<Napi::String>().Utf8Value().c_str()]
      ];
    }
    */

    [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionAppNameKey];

    [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionNameKey];

    [serverDescription setObject:[NSString stringWithUTF8String:description.Get("SyphonServerDescriptionUUIDKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionUUIDKey];

    [serverDescription setObject:[NSNumber numberWithUnsignedInt:description.Get("SyphonServerDescriptionDictionaryVersionKey").As<Napi::Number>().Uint32Value()] forKey:@"SyphonServerDescriptionDictionaryVersionKey"];

    // TODO: Get from description itself.
    NSDictionary *surfaces = [NSDictionary dictionaryWithObjectsAndKeys: @"SyphonSurfaceTypeIOSurface", @"SyphonSurfaceType", nil];
    [serverDescription setObject:[NSArray arrayWithObject:surfaces] forKey:@"SyphonServerDescriptionSurfacesKey"];

    Napi::String appName = description.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>();
    // Napi::String serverName = description.Get("SyphonServerDescriptionNameKey").As<Napi::String>();

    if (CGLGetCurrentContext() == NULL) {

      printf("Current CGLContextObj doesn't exist. Creating new context.\n");
      _CreateCurrentContext(env);

    }


    m_client = [[SyphonOpenGLClient alloc] initWithServerDescription:[serverDescription copy]
                                                              context:CGLGetCurrentContext()
                                                              options:nil 
                                                      newFrameHandler:^(SyphonOpenGLClient *client) {
        // TODO: napi_threadsafe_callback
    }];

    NSLog(@"%@", m_client);
    NSLog(@"IS VALID %@", m_client.isValid ? @"true" : @"false");
    printf("Initialized Client listening to application '%s'.\n", appName.Utf8Value().c_str());

    // m_lock = OS_UNFAIR_LOCK_INIT;

    // printf("Initialize Client for Server's named '%s'.\n", TO_C_STRING(info[0]));
    // [[NSRunLoop currentRunLoop] run];
  } catch (char const *err)
  {
    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();
  }

}

/**
 * The SyphonOpenGLServer destructor: will call Dispose on server and tear-down any resources associated.
 */
SyphonOpenGLClientWrapper::~SyphonOpenGLClientWrapper()
{
  _Dispose();
}

#pragma mark Static methods.

bool SyphonOpenGLClientWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}


#pragma mark Instance methods.

/**
 * Dealloc server and tear-down any resources associated.
 */
void SyphonOpenGLClientWrapper::Dispose(const Napi::CallbackInfo& info)
{
  _Dispose();
}

void SyphonOpenGLClientWrapper::_Dispose() {
  CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  // m_frame_callback = nullptr;
  printf("Dispose SyphonOpenGLClient.\n");

  if (m_client != NULL) {
    printf("Stops SyphonOpenGLClient.\n");
    [m_client stop];
    [m_client release];
    m_client = NULL;
  }

}

/*
// See: https://github.com/Syphon/Syphon-Framework/issues/94
Napi::Value SyphonOpenGLClientWrapper::GetFrame(const Napi::CallbackInfo& info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  uint8_t* pixelBuffer = _DrawFrame(m_client);
  Napi::ArrayBuffer result = Napi::ArrayBuffer::New(env, pixelBuffer, m_width * m_height * 4);
  delete[] pixelBuffer;

  return result;
}
*/

Napi::Value SyphonOpenGLClientWrapper::GetFrame(const Napi::CallbackInfo& info)
{

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  uint8_t* pixelBuffer = _DrawFrame(m_client);
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  NodeSyphonFramePromiseWorker *worker = new NodeSyphonFramePromiseWorker(deferred, pixelBuffer, m_width, m_height);

  // Do not delete pixel buffer: Promise will do it.

  worker->SuppressDestruct();
  worker->Queue();  

  return deferred.Promise();

}

Napi::Value SyphonOpenGLClientWrapper::Width(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return Napi::Number::New(env, m_width);
}

Napi::Value SyphonOpenGLClientWrapper::Height(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return Napi::Number::New(env, m_height);
}

// Thanks to https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
void SyphonOpenGLClientWrapper::_CreateCurrentContext(Napi::Env env) {

  CGLContextObj context;

  CGLPixelFormatAttribute attributes[3] = {
    kCGLPFAAccelerated, 
    kCGLPFANoRecovery,
    // kCGLPFADoubleBuffer,
    (CGLPixelFormatAttribute) 0
  };

  CGLPixelFormatObj pix;

  CGLError errorCode;

  GLint num; // Stores the number of possible pixel formats

  errorCode = CGLChoosePixelFormat( attributes, &pix, &num );

  if (errorCode > 0) {
    // TODO: CGLError to string.
    Napi::Error::New(env, "choosePixelFormat returned an error").ThrowAsJavaScriptException();
  }

  errorCode = CGLCreateContext(pix, NULL, &context);
  if (errorCode > 0) {
    Napi::Error::New(env, "CGLCreateContext returned an error").ThrowAsJavaScriptException();
  }

  CGLDestroyPixelFormat(pix);

  errorCode = CGLSetCurrentContext( context );
  if (errorCode > 0) {
    Napi::Error::New(env, "CGLSetCurrentContext returned an error").ThrowAsJavaScriptException();
  }

}

uint8_t *SyphonOpenGLClientWrapper::_DrawFrame(SyphonOpenGLClient *client) {
  SyphonOpenGLImage *frame = [client newFrameImage];
  m_width = [frame textureSize].width;
  m_height = [frame textureSize].height;

  /*
  glTexCoord2f(0.0f, 0.0f); glVertex2f(-1.0f, -1.0f);
  glTexCoord2f(m_width, 0.0f); glVertex2f(1.0f, -1.0f);
  glTexCoord2f(m_width, m_height); glVertex2f(1.0f, 1.0f);
  glTexCoord2f(0.0f, m_height); glVertex2f(-1.0f, 1.0f);
  */

  uint8_t* pixelBuffer = new uint8_t[m_width * m_height * 4];
  std::memset(pixelBuffer, 0, m_width * m_height * 4);

  GLuint fbo;

  CGLLockContext(CGLGetCurrentContext());
  
  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_RECTANGLE, [frame textureName], 0);

  glBindTexture(GL_TEXTURE_RECTANGLE, [frame textureName]);

  glViewport(0, 0, m_width, m_height);
  glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
  // glClear(GL_COLOR_BUFFER_BIT); 

  glEnable(GL_TEXTURE_RECTANGLE);
  glDisable(GL_DEPTH_TEST);

  glBindTexture(GL_TEXTURE_RECTANGLE, [frame textureName]);

  glBegin(GL_QUADS);
  
  glTexCoord2f(0.0f, 0.0f); glVertex2f(-1.0f, -1.0f);
  glTexCoord2f(m_width, 0.0f); glVertex2f(1.0f, -1.0f);
  glTexCoord2f(m_width, m_height); glVertex2f(1.0f, 1.0f);
  glTexCoord2f(0.0f, m_height); glVertex2f(-1.0f, 1.0f);

  glEnd();

  glReadPixels(0, 0, m_width, m_height, GL_RGBA, GL_UNSIGNED_BYTE, pixelBuffer);

  glBindTexture(GL_TEXTURE_RECTANGLE, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &fbo);

  [frame release];
  CGLUnlockContext(CGLGetCurrentContext());

  return pixelBuffer;
}

// Class definition.

Napi::Object SyphonOpenGLClientWrapper::Init(Napi::Env env, Napi::Object exports)
{

	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLClient", {

    // Methods.

    InstanceMethod("dispose", &SyphonOpenGLClientWrapper::Dispose),
    InstanceMethod("newFrame", &SyphonOpenGLClientWrapper::GetFrame),

    // Accessors.

    // InstanceAccessor("newFrame", &SyphonOpenGLClientWrapper::GetFrame, nullptr, napi_enumerable),
    InstanceAccessor("width", &SyphonOpenGLClientWrapper::Width, nullptr, napi_enumerable),
    InstanceAccessor("height", &SyphonOpenGLClientWrapper::Height, nullptr, napi_enumerable),

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLClient", func);

  return exports;

}
