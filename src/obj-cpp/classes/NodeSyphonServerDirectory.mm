#include <stdio.h>
#include <iostream>

#include "NodeSyphonServerDirectory.h"

#include "../helpers/NodeSyphonHelpers.h"

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
    
    printf("{\"NodeSyphonMessageTypeKey\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessageKey\": \"Signal handler called...\"}");
    
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

Napi::FunctionReference SyphonServerDirectoryWrapper::constructor;
SyphonServerDirectoryWrapper::SyphonServerDirectoryWrapper(const Napi::CallbackInfo& info)
: Napi::ObjectWrap<SyphonServerDirectoryWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  signal(SIGINT, sigHandler);
  // signal(SIGSEV, sigHandler);
  signal(SIGBUS, sigHandler);
  signal(SIGKILL, sigHandler);
  signal(SIGTERM, sigHandler);
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

  printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessage\": \"Listen to Syphon notifications...\"}");

  _announce_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerAnnounceNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}", [toJSON(SyphonServerAnnounceNotification, [notification userInfo]) UTF8String]);
      }
    ];

    _retire_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerRetireNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}", [toJSON(SyphonServerRetireNotification, [notification userInfo]) UTF8String]);
      }
    ];

    _update_observer = [[NSNotificationCenter defaultCenter] addObserverForName:SyphonServerUpdateNotification
      object: nil
      queue: nil
      usingBlock: ^ (NSNotification * notification) {
        printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageNotification\", \"NodeSyphonMessage\": \%s}", [toJSON(SyphonServerUpdateNotification, [notification userInfo]) UTF8String]);
      }
    ];

    [[NSRunLoop currentRunLoop] run];
}

void SyphonServerDirectoryWrapper::_Dispose() {

    printf("{\"NodeSyphonMessageType\": \"NodeSyphonMessageInfo\", \"NodeSyphonMessage\": \"Deallocation server directory listener...\"}");
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

Napi::Object SyphonServerDirectoryWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "ServerDirectory", {

    // Methods.

    InstanceMethod("listen", &SyphonServerDirectoryWrapper::Listen),
    InstanceMethod("dispose", &SyphonServerDirectoryWrapper::Dispose),

  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("ServerDirectory", func);

  return exports;

}
