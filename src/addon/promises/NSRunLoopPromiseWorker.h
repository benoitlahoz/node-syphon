#ifndef __NS_RUN_LOOP_PROMISE_WORKER_H__
#define __NS_RUN_LOOP_PROMISE_WORKER_H__

#include "PromiseWorker.h"
#include <Cocoa/Cocoa.h>
#include <Foundation/Foundation.h>
#include <napi.h>

using namespace syphon;

// Was an attempt to run an NSRunLoop in a Promise.
class NSRunLoopPromiseWorker : public PromiseWorker {

public:
  NSRunLoopPromiseWorker(Napi::Promise::Deferred const &d) : PromiseWorker(d) {}
  virtual ~NSRunLoopPromiseWorker() {};

  void Execute() {
    // No napi or js function may be called here.
    // TODO: Find a way to get pixel buffer here. For the time being this
    // promise is... synchronous :)
  }

  void OnOK() {
    printf("Run Loop\n");
    [[NSRunLoop currentRunLoop] run];
    return;
  }

  void OnError(const Napi::Error &e) {
    this->deferred.Reject(e.Value());
    return;
  }
};

#endif
