#ifndef __TEXTURE_EVENT_LISTENER_H__
#define __TEXTURE_EVENT_LISTENER_H__

#include <IOSurface/IOSurface.h>
#include <napi.h>

namespace syphon {

class TextureEventListener {
public:
  TextureEventListener();
  ~TextureEventListener();

  void Dispose();

  void Set(Napi::Env env, Napi::Function listener);
  void Call(uint8_t *buffer, size_t width, size_t height,
            std::string pixel_format, unsigned long frame_count,
            long long time_elapsed);

  void Test(const Napi::CallbackInfo &info);

private:
  Napi::ThreadSafeFunction m_listener;
};
} // namespace syphon

#endif