#ifndef __FRAME_EVENT_LISTENERS_H__
#define __FRAME_EVENT_LISTENERS_H__

#include <napi.h>

namespace syphon
{

  class FrameEventListeners
  {
    public:
        FrameEventListeners();
        ~FrameEventListeners();

        void Add(Napi::Env env, Napi::Function listener);
        void Call(uint8_t * buffer, size_t width, size_t height);

    private:
      std::vector<Napi::ThreadSafeFunction> m_listeners;
  };
}

#endif