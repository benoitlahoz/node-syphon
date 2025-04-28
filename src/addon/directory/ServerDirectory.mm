#include <stdio.h>
#include <iostream>

#include "ServerDirectory.h"

#define NodeSyphonMessageTypeKey @"NodeSyphonMessageType"
#define NodeSyphonMessageKey @"NodeSyphonMessage"

#define NodeSyphonMessageTypeInfo @"NodeSyphonMessageInfo"
#define NodeSyphonMessageTypeError @"NodeSyphonMessageError"
#define NodeSyphonMessageTypeNotification @"NodeSyphonMessageNotification"

#define NodeSyphonNotificationTypeKey @"NodeSyphonNotificationType"
#define NodeSyphonServerDictionaryKey @"NodeSyphonServerDictionary"

id _announce_observer;
id _retire_observer;
id _update_observer;

void sigHandler(int sig) {

    // This is the same as our instance's _Dispose method.
    
    printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessage\": \"Signal handler called: stopping NSRunLoop...\"}\n");
    
    CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);

    [[NSNotificationCenter defaultCenter] removeObserver:_announce_observer];
    [[NSNotificationCenter defaultCenter] removeObserver:_retire_observer];
    [[NSNotificationCenter defaultCenter] removeObserver:_update_observer];

    _announce_observer = nil;
    _retire_observer = nil;
    _update_observer = nil;
    
    exit(0);
}

NSString * toJSON(NSString *type, NSDictionary *dic) {
    NSString *json = [NSString stringWithFormat:
                        @"{"
                        @"\"%@\": \"%@\","
                        @"\"%@\": {"

                        // App name
                        @"\"%@\": "
                        @"\"%@\","

                        // Name
                        @"\"%@\": "
                        @"\"%@\","

                        // UUID
                        @"\"%@\": "
                        @"\"%@\","

                        // Version
                        @"\"%@\": "
                        @"%i,"

                        // Surface
                        @"\"%@\": "
                        @"["
                        @"{"
                        @"\"%@\": "
                        @"\"%@\""
                        @"}"
                        @"]"

                        // End
                        @"}"
                        @"}",
                        NodeSyphonNotificationTypeKey,
                        type,
                        NodeSyphonServerDictionaryKey,
                        SyphonServerDescriptionAppNameKey,
                        [dic objectForKey:SyphonServerDescriptionAppNameKey],
                        SyphonServerDescriptionNameKey,
                        [dic objectForKey:SyphonServerDescriptionNameKey],
                        SyphonServerDescriptionUUIDKey,
                        [dic objectForKey: SyphonServerDescriptionUUIDKey],
                        @"SyphonServerDescriptionDictionaryVersionKey",
                        [[dic objectForKey: @"SyphonServerDescriptionDictionaryVersionKey"] intValue],
                        @"SyphonServerDescriptionSurfacesKey",
                        @"SyphonSurfaceType",
                        @"SyphonSurfaceTypeIOSurface"
                      ];
    
    return json;
}

using namespace syphon;

Napi::FunctionReference ServerDirectoryWrapper::constructor;
ServerDirectoryWrapper::ServerDirectoryWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<ServerDirectoryWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  signal(SIGINT, sigHandler);
  signal(SIGSEGV, sigHandler);
  signal(SIGBUS, sigHandler);
  signal(SIGKILL, sigHandler);
  signal(SIGTERM, sigHandler);
}

ServerDirectoryWrapper::~ServerDirectoryWrapper()
{
  _Dispose();
}

void ServerDirectoryWrapper::Dispose(const Napi::CallbackInfo& info)
{
  _Dispose();
}

void ServerDirectoryWrapper::Listen(const Napi::CallbackInfo& info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // TODO: \n at the end of line to flush.
  // See https://stackoverflow.com/questions/39180642/why-does-printf-not-produce-any-output

  // Very hacky way to communicate with main process from spawn server directory.
  printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessage\": \"Listening to Syphon directory server notifications...\"}\n");

  _announce_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerAnnounceNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}\n", [toJSON(SyphonServerAnnounceNotification, [notification userInfo]) UTF8String]);
      }
    ];

    _retire_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerRetireNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}\n", [toJSON(SyphonServerRetireNotification, [notification userInfo]) UTF8String]);
      }
    ];

    _update_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerUpdateNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}\n", [toJSON(SyphonServerUpdateNotification, [notification userInfo]) UTF8String]);
      }
    ];

    [[NSRunLoop currentRunLoop] run];
}

void ServerDirectoryWrapper::_Dispose() {

    printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessage\": \"Deallocation of server directory listener...\"}\n");
    if (_announce_observer) {
      CFRunLoopStop([[NSRunLoop currentRunLoop] getCFRunLoop]);

      [[NSNotificationCenter defaultCenter] removeObserver:_announce_observer];
      [[NSNotificationCenter defaultCenter] removeObserver:_retire_observer];
      [[NSNotificationCenter defaultCenter] removeObserver:_update_observer];

      _announce_observer = nil;
      _retire_observer = nil;
      _update_observer = nil;
    }

}

// Class definition.

Napi::Object ServerDirectoryWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "ServerDirectory", {

    // Methods.

    InstanceMethod("listen", &ServerDirectoryWrapper::Listen),
    InstanceMethod("dispose", &ServerDirectoryWrapper::Dispose),

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("ServerDirectory", func);

  return exports;

}
