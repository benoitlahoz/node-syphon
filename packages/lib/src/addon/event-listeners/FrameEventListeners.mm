#include "FrameEventListeners.h"
#include "../helpers/macros.h"

using namespace syphon;

FrameEventListeners::FrameEventListeners() {
    m_listeners = {};
}

void FrameEventListeners::Add(Napi::Env env, Napi::Function listener) {
    auto fn = Napi::ThreadSafeFunction::New(
      env,
      listener, 
      "Frame Event Listener",
      0,
      1
    );

    m_listeners.push_back(fn);
}

void FrameEventListeners::Call(uint8_t * buffer, size_t width, size_t height) {
    auto callback = [buffer, width, height](Napi::Env env, Napi::Function js_callback) {

        auto napi_buffer = Napi::Buffer<uint8_t>::NewOrCopy(env, buffer, width * height * 4, [](Napi::BasicEnv, void* finalizeData) {
            // Kept for memory: if calling 'callback' mutiple times we have to keep the original buffer on.
            // delete[] static_cast<uint8_t*>(finalizeData);
        });

        Napi::Object obj = Napi::Object::New(env);
        obj.Set("buffer", napi_buffer);
        obj.Set("width", Napi::Number::New(env, width));
        obj.Set("height", Napi::Number::New(env, height));

        js_callback.Call({ obj });
    };

    for (auto it = begin(m_listeners); it != end(m_listeners); ++it) {
        it->NonBlockingCall(callback);
    }

    // Delete original buffer when all callbacks have been called.
    delete[] buffer;
}