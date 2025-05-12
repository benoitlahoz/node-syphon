#ifndef ___SYPHON_PROMISE_WORKER_H___
#define ___SYPHON_PROMISE_WORKER_H___

#include <napi.h>

namespace syphon {

class PromiseWorker : public Napi::AsyncWorker {

public:
  PromiseWorker(Napi::Promise::Deferred const &d)
      : Napi::AsyncWorker(get_fake_callback(d.Env()).Value()), deferred(d) {

    this->deferred = d;
  }
  virtual ~PromiseWorker() {};

protected:
  Napi::Promise::Deferred deferred;

private:
  static Napi::Value noop(Napi::CallbackInfo const &info);
  static Napi::Reference<Napi::Function> const &
  get_fake_callback(Napi::Env const &env);
};

} // namespace syphon

#endif
