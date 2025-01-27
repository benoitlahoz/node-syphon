#include "PromiseWorker.h"

using namespace syphon;

static Napi::Reference<Napi::Function> fake_callback;

Napi::Value PromiseWorker::noop(Napi::CallbackInfo const &info)
{
  return info.Env().Undefined();
}

Napi::Reference<Napi::Function> const &PromiseWorker::get_fake_callback(Napi::Env const &env)
{
  static Napi::Reference<Napi::Function> fake_callback;
  if (fake_callback.IsEmpty())
  {
    fake_callback = Napi::Reference<Napi::Function>::New(Napi::Function::New(env, noop), 1);
  }

  return fake_callback;
}
