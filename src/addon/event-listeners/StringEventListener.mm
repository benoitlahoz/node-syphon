#include "StringEventListener.h"
#include "../helpers/macros.h"

using namespace syphon;

StringEventListener::StringEventListener() { m_listener = NULL; }

void StringEventListener::Set(Napi::Env env, Napi::Function listener) {
  m_listener = Napi::ThreadSafeFunction::New(env, listener,
                                             "String Event Listener", 0, 1);
}

StringEventListener::~StringEventListener() {
  if (m_listener != NULL) {
    m_listener.Release();
    m_listener = NULL;
  }
}

void StringEventListener::Dispose() {
  if (m_listener != NULL) {
    m_listener.Release();
    m_listener = NULL;
  }
}

void StringEventListener::Call(std::string str) {
  if (m_listener != NULL) {
    printf("Emit Info\n");
    auto callback = [str](Napi::Env env, Napi::Function js_callback) {
      Napi::String result = Napi::String::New(env, str);
      js_callback.Call({result});
    };

    m_listener.NonBlockingCall(callback);
  }
}