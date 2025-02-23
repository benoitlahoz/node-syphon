#ifndef __DIRECTORY_EVENT_LISTENER__
#define __DIRECTORY_EVENT_LISTENER__

#include <napi.h>
#include <Foundation/Foundation.h>
#include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>

namespace syphon
{

  class DirectoryEventListener
  {
    public:
        DirectoryEventListener();
        ~DirectoryEventListener();

        void Dispose();

        void Set(Napi::Env env, Napi::Function listener);
        void Call(NSDictionary * dictionary);

    private:
      Napi::ThreadSafeFunction m_listener;
  };
}

#endif