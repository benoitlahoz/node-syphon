#ifndef PIXEL_BUFFER_PROMISE_WORKER_H
#define PIXEL_BUFFER_PROMISE_WORKER_H

#include <napi.h>

#include "PromiseWorker.h"

using namespace syphon;

// Was used for pulling frames from server -> replaced by 'On' callback in
// servers.

class PixelBufferPromiseWorker : public PromiseWorker {

public:
  PixelBufferPromiseWorker(Napi::Promise::Deferred const &d,
                           uint8_t *pixel_buffer, size_t width, size_t height)
      : PromiseWorker(d) {
    this->m_pixel_buffer = pixel_buffer;
    this->m_width = width;
    this->m_height = height;
  }
  virtual ~PixelBufferPromiseWorker() {};

  void Execute() {
    // No napi or js function may be called here.
    // TODO: Find a way to get pixel buffer here. For the time being this
    // promise is... synchronous :)
  }

  void OnOK() {
    auto buffer = Napi::Buffer<uint8_t>::NewOrCopy(
        Env(), m_pixel_buffer, m_width * m_height * 4,
        [](Napi::BasicEnv, void *finalizeData) {
          delete[] static_cast<uint8_t *>(finalizeData);
        });
    this->deferred.Resolve(buffer);
    return;
  }

  void OnError(const Napi::Error &e) {
    this->deferred.Reject(e.Value());
    return;
  }

private:
  uint8_t *m_pixel_buffer;
  size_t m_width;
  size_t m_height;
};

#endif
