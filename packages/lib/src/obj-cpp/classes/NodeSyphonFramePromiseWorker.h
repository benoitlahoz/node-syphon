#ifndef NODE_SYPHON_FRAME_PROMISE_WORKER_H
#define NODE_SYPHON_FRAME_PROMISE_WORKER_H

#include <napi.h>

#include "./../helpers/promise_worker.h"

using namespace syphon;

class NodeSyphonFramePromiseWorker : public PromiseWorker
{

public:
  NodeSyphonFramePromiseWorker(Napi::Promise::Deferred const &d, uint8_t *pixel_buffer, size_t width, size_t height) : PromiseWorker(d)
  {
    this->m_pixel_buffer = pixel_buffer;
    this->m_width = width;
    this->m_height = height;
  }
  virtual ~NodeSyphonFramePromiseWorker(){};

  void Execute()
  {
    // FIXME: To use this (which seems to be the normal way to do it) we'll have to 'properly lock to enter in V8 API' (?).

    // Napi::HandleScope scope(this->Env());
    // this->m_result = Napi::ArrayBuffer::New(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4);
    // this->m_result = Napi::Buffer<uint8_t>::Copy(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4)
  }

  void OnOK()
  {

    Napi::HandleScope scope(this->Env());
    // this->deferred.Resolve(this->m_result);

    // For the record: os forbidden with Electron >= 21
    // See: https://www.electronjs.org/blog/v8-memory-cage and the solution at the end of the article.
    // https://github.com/nodejs/node-addon-api/blob/main/doc/external_buffer.md
    //
    // auto buffer = Napi::ArrayBuffer::New(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4);

  
    auto buffer = Napi::Buffer<uint8_t>::NewOrCopy(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4, [](Napi::BasicEnv, void* finalizeData) {
      // Delete the pixel buffer.
      delete[] static_cast<uint8_t*>(finalizeData);
    });
    this->deferred.Resolve(buffer);

    return;
  }

  void OnError(const Napi::Error &e)
  {

    this->deferred.Reject(e.Value());

    return;
  }

private:
  uint8_t *m_pixel_buffer;
  size_t m_width;
  size_t m_height;

  // Napi::Buffer<uint8_t> m_result;
};

#endif
