#ifndef __STRING_EVENT_LISTENER_H__
#define __STRING_EVENT_LISTENER_H__

#include <napi.h>
#include <Foundation/Foundation.h>
#include <Cocoa/Cocoa.h>

namespace syphon
{

  class StringEventListener
  {
    public:
        StringEventListener();
        ~StringEventListener();

        void Dispose();

        void Set(Napi::Env env, Napi::Function listener);
        void Call(std::string str);

    private:
      Napi::ThreadSafeFunction m_listener;
  };
}

#endif