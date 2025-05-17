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

void TextureEventListener::Call(uint8_t *surface, size_t width, size_t height,
                                std::string pixel_format,
                                unsigned long frame_count,
                                long long time_elapsed) {
  if (m_listener != NULL) {

    auto callback = [surface, pixel_format, width, height, frame_count,
                     time_elapsed](Napi::Env env, Napi::Function js_callback) {
      auto napi_buffer = Napi::Buffer<uint8_t>::Copy(
          env,
          reinterpret_cast<const uint8_t*>(&surface),
          sizeof(IOSurfaceRef));

      Napi::Object obj = Napi::Object::New(env);
      obj.Set("surface", napi_buffer);
      obj.Set("width", Napi::Number::New(env, width));
      obj.Set("height", Napi::Number::New(env, height));
      obj.Set("pixelFormat", Napi::String::New(env, pixel_format));
      obj.Set("frameCount", Napi::Number::New(env, frame_count));
      obj.Set("timestamp", Napi::Number::New(env, time_elapsed));

      js_callback.Call({obj});
    };

    m_listener.NonBlockingCall(callback);
  }
}