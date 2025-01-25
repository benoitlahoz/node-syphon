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
    // Napi::HandleScope scope(this->Env());

    // this->m_result = Napi::ArrayBuffer::New(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4);
    delete[] this->m_pixel_buffer;
  }

  void OnOK()
  {

    Napi::HandleScope scope(this->Env());
    // this->deferred.Resolve(this->m_result);
    this->deferred.Resolve(Napi::ArrayBuffer::New(this->Env(), this->m_pixel_buffer, this->m_width * this->m_height * 4));

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

  Napi::ArrayBuffer m_result;
};

#endif
