#include "FrameEventListener.h"
#include "../helpers/macros.h"

using namespace syphon;

FrameEventListener::FrameEventListener() {
    m_listener = NULL;
}

void FrameEventListener::Set(Napi::Env env, Napi::Function listener) {
    m_listener = Napi::ThreadSafeFunction::New(
      env,
      listener, 
      "Frame Event Listener",
      0,
      1
    );
}

FrameEventListener::~FrameEventListener()
{
    if (m_listener != NULL) {
        m_listener.Release(); 
        m_listener = NULL;
    }
}

void FrameEventListener::Dispose()
{
    if (m_listener != NULL) {
        m_listener.Release(); 
        m_listener = NULL;
    }
}

void FrameEventListener::Call(uint8_t * buffer, size_t width, size_t height) {
    if (m_listener != NULL) {
        auto callback = [buffer, width, height](Napi::Env env, Napi::Function js_callback) {

            auto napi_buffer = Napi::Buffer<uint8_t>::NewOrCopy(env, buffer, width * height * 4, [](Napi::BasicEnv, void* finalizeData) {

                delete[] static_cast<uint8_t *>(finalizeData);

            });

            Napi::Object obj = Napi::Object::New(env);
            obj.Set("buffer", napi_buffer);
            obj.Set("width", Napi::Number::New(env, width));
            obj.Set("height", Napi::Number::New(env, height));

            js_callback.Call({ obj });

        };

        m_listener.BlockingCall(callback); 
    }
}