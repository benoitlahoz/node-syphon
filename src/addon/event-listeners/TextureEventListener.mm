#include "TextureEventListener.h"
#include "../helpers/macros.h"

using namespace syphon;

TextureEventListener::TextureEventListener() { m_listener = NULL; }

void TextureEventListener::Set(Napi::Env env, Napi::Function listener) {
  m_listener = Napi::ThreadSafeFunction::New(env, listener,
                                             "Texture Event Listener", 0, 1);
}

TextureEventListener::~TextureEventListener() {
  if (m_listener != NULL) {
    m_listener.Release();
    m_listener = NULL;
  }
}

void TextureEventListener::Dispose() {
  if (m_listener != NULL) {
    m_listener.Release();
    m_listener = NULL;
  }
}

void TextureEventListener::Call(uint8_t *surface, size_t width, size_t height) {
  if (m_listener != NULL) {
    auto callback = [surface, width, height](Napi::Env env,
                                             Napi::Function js_callback) {
      auto napi_buffer = Napi::Buffer<uint8_t>::NewOrCopy(
          env,
          const_cast<uint8_t *>(reinterpret_cast<const uint8_t *>(&surface)),
          sizeof(IOSurfaceRef), [](Napi::BasicEnv, void *finalizeData) {
            // delete[] static_cast<uint8_t *>(finalizeData);
          });

      Napi::Object obj = Napi::Object::New(env);
      obj.Set("surface", napi_buffer);
      obj.Set("width", Napi::Number::New(env, width));
      obj.Set("height", Napi::Number::New(env, height));

      js_callback.Call({obj});
    };

    m_listener.NonBlockingCall(callback); // Was BlockingCall
  }
}