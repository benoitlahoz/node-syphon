#ifndef __TEXTURE_EVENT_LISTENER_H__
#define __TEXTURE_EVENT_LISTENER_H__

#include <napi.h>
#include <IOSurface/IOSurface.h>

namespace syphon
{

  class TextureEventListener
  {
    public:
        TextureEventListener();
        ~TextureEventListener();

        void Dispose();

        void Set(Napi::Env env, Napi::Function listener);
        void Call(uint8_t * buffer, size_t width, size_t height);

    private:
      Napi::ThreadSafeFunction m_listener;
  };
}

#endif