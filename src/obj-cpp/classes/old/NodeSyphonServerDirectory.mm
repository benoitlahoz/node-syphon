#include <stdio.h>
#include <iostream>
#include <signal.h>

#include "NodeSyphonServerDirectory.h"

#include "../helpers/NodeSyphonHelpers.h"

#define IP_ADDR "127.0.0.1"
#define NOTIFICATION_CHANNEL "io.benoitlahoz.syphon.ipc.notification"
#define SERVERS_CHANNEL "io.benoitlahoz.syphon.ipc.servers"

using namespace masesk;
using namespace syphon;

EasySocket _socketManager;

void sigHandler(int sig) {
  // CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);
  
  NSLog(@"Quitting directory listener...");
  _socketManager.closeConnection(NOTIFICATION_CHANNEL);
  
  // exit(0);
}

Napi::FunctionReference SyphonServerDirectoryWrapper::constructor;
SyphonServerDirectoryWrapper::SyphonServerDirectoryWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<SyphonServerDirectoryWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // _socketManager.socketConnect(NOTIFICATION_CHANNEL, IP_ADDR, 8080);
  printf("NEW Manager %p\n", (void *) &_socketManager);

  signal(SIGINT, sigHandler);
  // signal(SIGSEV, sigHandler);
  signal(SIGBUS, sigHandler);
  signal(SIGKILL, sigHandler);
  signal(SIGTERM, sigHandler);
}
/*
void handleData(const void * data, int length) {
    NSLog(@"HANDLE");
    // printf("recieved response: %s\n", (const char *)data);
    NSString *received = [NSString stringWithUTF8String:(const char *)data];
    NSLog(@"%@", received);
}
*/



void handleData(const void * data, int length) {
  if (length > 0) {
    NSData * received = [NSData dataWithBytes:data length:(NSUInteger)length];
    // NSLog(@"RECEIVED %@", received);
    NSDictionary *dic = (NSDictionary *)[NSKeyedUnarchiver unarchiveObjectWithData:received];
    NSLog(@"RECEIVED: %@", dic);
  }
}

/**
 * The SyphonOpenGLServer destructor: will call dealloc on server and tear-down any resources associated.
 */
SyphonServerDirectoryWrapper::~SyphonServerDirectoryWrapper()
{
  _Dispose();
}

void SyphonServerDirectoryWrapper::Dispose(const Napi::CallbackInfo& info)
{
  _Dispose();
}

void SyphonServerDirectoryWrapper::Listen(const Napi::CallbackInfo& info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  NSLog(@"Starting socket client: Listening...");
  _socketManager.socketListen(NOTIFICATION_CHANNEL, 8080, &handleData);
}

void SyphonServerDirectoryWrapper::_Dispose() {
  NSLog(@"Closing socket client connection: %@", [NSString stringWithUTF8String: NOTIFICATION_CHANNEL]);
  // printf("%p\n", _socketManager);
  printf("Dispose Manager %p\n", (void *) &_socketManager);
  _socketManager.closeConnection(NOTIFICATION_CHANNEL);
}

Napi::Value SyphonServerDirectoryWrapper::Servers(const Napi::CallbackInfo &info) {

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return Napi::Boolean::New(env, true);
}



// Class definition.

Napi::Object SyphonServerDirectoryWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "ServerDirectory", {

    // Methods.

    InstanceMethod("listen", &SyphonServerDirectoryWrapper::Listen),
    InstanceMethod("dispose", &SyphonServerDirectoryWrapper::Dispose),

    // Accessors.

    InstanceAccessor("servers", &SyphonServerDirectoryWrapper::Servers, nullptr, napi_enumerable),

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("ServerDirectory", func);

  return exports;

}
