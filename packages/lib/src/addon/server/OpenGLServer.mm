#include <stdio.h>
#include <iostream>

#include "OpenGLServer.h"

#import "../helpers/NodeSyphonHelpers.h"

using namespace syphon;

Napi::FunctionReference OpenGLServerWrapper::constructor;

/**
 * The SyphonOpenGLServer constructor.
 */
OpenGLServerWrapper::OpenGLServerWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<OpenGLServerWrapper>(info)
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
    
    _texture = 0;



    // m_lock = OS_UNFAIR_LOCK_INIT;

    printf("Initialize Server with name '%s'.\n", TO_C_STRING(info[0]));

    if (CGLGetCurrentContext() == NULL) {

      printf("Current CGLContextObj doesn't exist. Creating new context.\n");
      _CreateCurrentContext(env);

    }

    m_server = [[SyphonOpenGLServer alloc] initWithName:TO_NSSTRING(info[0]) context:CGLGetCurrentContext() options:nil];
    m_callbacks_count = 0;

    // Trigger eventual listeners.
    // env.SetInstanceData(this);
    // OpenGLServerWrapper::_OnServerCreated(info);

  } catch (char const *err)
  {

    Napi::TypeError::New(env, err).ThrowAsJavaScriptException();

  }

}

/**
 * The SyphonOpenGLServer destructor: will call Dispose on server and tear-down any resources associated.
 */
OpenGLServerWrapper::~OpenGLServerWrapper()
{
  printf("Syphon server destructor will call dispose.\n");
  _Dispose();
}

#pragma mark Static methods.

bool OpenGLServerWrapper::HasInstance(Napi::Value value)
{
  return value.As<Napi::Object>().InstanceOf(constructor.Value());
}


#pragma mark Instance methods.

/**
 * Dealloc server and tear-down any resources associated.
 */
void OpenGLServerWrapper::Dispose(const Napi::CallbackInfo& info)
{
  printf("Syphon server dispose method will call dispose.\n");
  _Dispose();
}

void OpenGLServerWrapper::_Dispose() {

  printf("Syphon server will dispose.\n");

  if (m_server != NULL) {
    [m_server release];
    m_server = NULL;
  }
  // TODO: CGLContextRelease ?

}

// Thanks to https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
void OpenGLServerWrapper::_CreateCurrentContext(Napi::Env env) {

  CGLContextObj context;

  CGLPixelFormatAttribute attributes[3] = {
    kCGLPFAAccelerated, 
    kCGLPFANoRecovery,
    // kCGLPFADoubleBuffer,
    (CGLPixelFormatAttribute) 0
  };

  CGLPixelFormatObj pix;

  CGLError errorCode;

  GLint num; // stores the number of possible pixel formats

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

void OpenGLServerWrapper::_GenerateTexture(GLenum textureTarget, GLsizei width, GLsizei height, uint8_t * data) {
  glEnable(textureTarget);
  glBindTexture(textureTarget, _texture);

  glTexImage2D(textureTarget, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);  // Was &data[0]

  glTexParameteri(textureTarget, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(textureTarget, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

  glBindTexture(textureTarget, 0);
  glDisable(textureTarget);

}

void OpenGLServerWrapper::PublishImageData(const Napi::CallbackInfo& info)
{

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // Only test the parameters on first call: we suppose that the function will be called 
  // with same parameters, so we can avoid checking at each new frame.
  
  if (!_first_check_passed) {

    if (info.Length() != 5) {
      Napi::TypeError::New(env, "Invalid number of parameters for 'publishImageData'").ThrowAsJavaScriptException();
    }
    
    if (!IS_UINT8_CLAMPED_ARRAY(info[0])) {
      Napi::TypeError::New(env, "1st parameter (data) must be an Uint8ClampedArray in 'publishImageData'").ThrowAsJavaScriptException();
    }
    
    if (!IS_TEXTURE_TARGET(info[1])) {
      Napi::TypeError::New(env, "2nd parameter (textureTarget) must be a string containing GL_TEXTURE_RECTANGLE_EXT or GL_TEXTURE_2D in 'publishImageData'").ThrowAsJavaScriptException();
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

    _first_check_passed = true;

  }

  try {

    std::string targetString = info[1].As<Napi::String>().Utf8Value();
    GLenum textureTarget = targetString == "GL_TEXTURE_RECTANGLE_EXT" ? GL_TEXTURE_RECTANGLE_EXT : GL_TEXTURE_2D;

    Napi::Object region = info[2].As<Napi::Object>();
    Napi::Object size = info[3].As<Napi::Object>();

    NSRect imageRegion = NSMakeRect(region.Get("x").ToNumber().FloatValue(), region.Get("y").ToNumber().FloatValue(), region.Get("width").ToNumber().FloatValue(), region.Get("height").ToNumber().FloatValue());

    NSSize textureDimensions = NSMakeSize(size.Get("width").ToNumber().FloatValue(), size.Get("height").ToNumber().FloatValue());
    
    BOOL flipped = info[4].As<Napi::Boolean>().Value() == true ? YES : NO; // Is this conversion necessary?

    // See: https://stackoverflow.com/a/59004450/1060921
    // os_unfair_lock_lock(&m_lock); 

    // See here: https://github.com/nodejs/node-addon-examples/blob/main/array_buffer_to_native/node-addon-api/array_buffer_to_native.cc
    Napi::ArrayBuffer buffer = info[0].As<Napi::TypedArrayOf<uint8_t>>().ArrayBuffer(); 

    CGLLockContext([m_server context]);

    glGenTextures(1, &_texture);  
    
    _GenerateTexture(
      textureTarget, 
      (GLsizei)textureDimensions.width, 
      (GLsizei)textureDimensions.height, 
      (uint8_t *)buffer.Data() 
    );

    [m_server publishFrameTexture:_texture 
              textureTarget:textureTarget 
              imageRegion:imageRegion 
              textureDimensions:textureDimensions 
              flipped:flipped
    ];

    glDeleteTextures(1, &_texture);

    

    auto channel_callbacks = OpenGLServerWrapper::m_listeners.find("frame");

    if (channel_callbacks != OpenGLServerWrapper::m_listeners.end()) {

      std::vector<Napi::ThreadSafeFunction> callbacks = channel_callbacks->second;

      for (auto it = begin(callbacks); it != end(callbacks); ++it) {
        // Calls registered callback.

        auto callback = [buffer](Napi::Env env, Napi::Function js_callback) {
          js_callback.Call({buffer});
        };

        it->NonBlockingCall(callback);
      }

    }

    CGLUnlockContext([m_server context]);

    // os_unfair_lock_unlock(&m_lock);

  } catch (char const *err)
  {
    printf("Error!.\n");
    Napi::Error::New(env, err).ThrowAsJavaScriptException();

  }

}

void OpenGLServerWrapper::On(const Napi::CallbackInfo &info)
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
  

  auto channel_callbacks = OpenGLServerWrapper::m_listeners.find(channel);

  if (channel_callbacks != OpenGLServerWrapper::m_listeners.end()) {
    // Add callback to existing list.

    std::vector<Napi::ThreadSafeFunction> callbacks = channel_callbacks->second;

    std::string resourceName = "FrameCallback_";
    resourceName += std::to_string(callbacks.size());

    auto threadSafeCallback = Napi::ThreadSafeFunction::New(env, callback, resourceName, 0, 1);

    callbacks.push_back(threadSafeCallback);
    channel_callbacks->second = callbacks;
  } else {
    auto threadSafeCallback = Napi::ThreadSafeFunction::New(env, callback, "FrameCallback_0", 0, 1);

    // Create callbacks list.

    std::vector<Napi::ThreadSafeFunction> callbacks = { threadSafeCallback };
    OpenGLServerWrapper::m_listeners.insert({ channel, callbacks });
  }
}

// Getters.

Napi::Value OpenGLServerWrapper::GetName(const Napi::CallbackInfo &info) 
{
  return Napi::String::New(info.Env(), [[m_server name] UTF8String]);
}

Napi::Value OpenGLServerWrapper::GetServerDescription(const Napi::CallbackInfo &info) 
{
  return [NodeSyphonHelpers serverDescription:[m_server serverDescription] info:info];
}

Napi::Value OpenGLServerWrapper::HasClients(const Napi::CallbackInfo &info) 
{
  return Napi::Boolean::New(info.Env(), [m_server hasClients]);
}

// Class definition.

Napi::Object OpenGLServerWrapper::Init(Napi::Env env, Napi::Object exports)
{

	Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "OpenGLServer", {

    // Methods.

    InstanceMethod("publishImageData", &OpenGLServerWrapper::PublishImageData),
    // InstanceMethod("publishFrameTexture", &OpenGLServerWrapper::PublishFrameTexture),
    InstanceMethod("on", &OpenGLServerWrapper::On),
    InstanceMethod("dispose", &OpenGLServerWrapper::Dispose),

    // Accessors.

    InstanceAccessor("name", &OpenGLServerWrapper::GetName, nullptr, napi_enumerable),
    InstanceAccessor("serverDescription", &OpenGLServerWrapper::GetServerDescription, nullptr, napi_enumerable),
    InstanceAccessor("hasClients", &OpenGLServerWrapper::HasClients, nullptr, napi_enumerable),    

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("OpenGLServer", func);

  return exports;

}
