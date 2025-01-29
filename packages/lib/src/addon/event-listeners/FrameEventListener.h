#ifndef __FRAME_EVENT_LISTENER_H__
#define __FRAME_EVENT_LISTENER_H__

#include <napi.h>

namespace syphon
{

  class FrameEventListener
  {
    public:
        FrameEventListener();
        ~FrameEventListener();

        void Dispose();

        void Set(Napi::Env env, Napi::Function listener);
        void Call(uint8_t * buffer, size_t width, size_t height);

    private:
      Napi::ThreadSafeFunction m_listener;
  };
}

#endif