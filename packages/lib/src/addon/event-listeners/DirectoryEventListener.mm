#include "DirectoryEventListener.h"
#include "../helpers/macros.h"

using namespace syphon;

DirectoryEventListener::DirectoryEventListener() {
    m_listener = NULL;
}

void DirectoryEventListener::Set(Napi::Env env, Napi::Function listener) {
    m_listener = Napi::ThreadSafeFunction::New(
        env,
        listener, 
        "Directory Event Listener",
        0,
        1
    );
}

DirectoryEventListener::~DirectoryEventListener()
{
    if (m_listener != NULL) {
        m_listener.Release(); 
        m_listener = NULL;
    }
}

void DirectoryEventListener::Dispose()
{
    if (m_listener != NULL) {
        m_listener.Release(); 
        m_listener = NULL;
    }
}

void DirectoryEventListener::Call(NSDictionary * dictionary) {
    if (m_listener != NULL) {
        printf("Class with userInfo!\n");
        auto callback = [dictionary](Napi::Env env, Napi::Function js_callback) {

            Napi::Object obj = Napi::Object::New(env);

            if ([dictionary objectForKey:SyphonServerDescriptionNameKey]) {
                obj.Set("SyphonServerDescriptionNameKey", Napi::String::New(env, [[dictionary objectForKey:SyphonServerDescriptionNameKey] UTF8String]));
            }

            if ([dictionary objectForKey:SyphonServerDescriptionAppNameKey]) {
                obj.Set("SyphonServerDescriptionAppNameKey", Napi::String::New(env, [[dictionary objectForKey:SyphonServerDescriptionAppNameKey] UTF8String]));
            }

            if ([dictionary objectForKey:SyphonServerDescriptionUUIDKey]) {
                obj.Set("SyphonServerDescriptionUUIDKey", Napi::String::New(env, [[dictionary objectForKey:SyphonServerDescriptionUUIDKey] UTF8String]));
            }

            if ([dictionary objectForKey:@"SyphonServerDescriptionDictionaryVersionKey"]) {
                obj.Set("SyphonServerDescriptionDictionaryVersionKey",  Napi::Number::New(env, [[dictionary objectForKey:@"SyphonServerDescriptionDictionaryVersionKey"] intValue]));
            }

            if ([dictionary objectForKey:@"SyphonServerDescriptionSurfacesKey"]) {
                Napi::Array arr = Napi::Array::New(env, [[dictionary objectForKey:@"SyphonServerDescriptionSurfacesKey"] length]);

                for (NSUInteger i = 0; i < [[dictionary objectForKey:@"SyphonServerDescriptionSurfacesKey"] length]; i++) {
                    NSDictionary * surface_dic = [dictionary objectForKey:@"SyphonServerDescriptionSurfacesKey"][i];

                    Napi::Object surface_description = Napi::Object::New(env);
                    surface_description.Set("SyphonSurfaceType", Napi::String::New(env, [surface_dic[@"SyphonSurfaceType"] UTF8String]));

                    arr.Set(i, surface_description);
                }

                obj.Set("SyphonServerDescriptionSurfacesKey",  arr);
            }

            js_callback.Call({ obj });

        };

        m_listener.NonBlockingCall(callback); 
    }
}