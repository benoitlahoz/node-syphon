#include "ServerDescriptionHelper.h"

using namespace syphon;

Napi::Object ServerDescriptionHelper::ToNapiObject(NSDictionary * serverDescription, const Napi::CallbackInfo & info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  Napi::Object obj = Napi::Object::New(env);

  if ([serverDescription objectForKey:SyphonServerDescriptionNameKey])
    obj.Set("SyphonServerDescriptionNameKey", [[serverDescription objectForKey:SyphonServerDescriptionNameKey] UTF8String]);

  if ([serverDescription objectForKey:SyphonServerDescriptionAppNameKey])
    obj.Set("SyphonServerDescriptionAppNameKey", [[serverDescription objectForKey:SyphonServerDescriptionAppNameKey] UTF8String]);

  if ([serverDescription objectForKey:SyphonServerDescriptionUUIDKey])
    obj.Set("SyphonServerDescriptionUUIDKey", [[serverDescription objectForKey:SyphonServerDescriptionUUIDKey] UTF8String]);

  return obj;
}

NSDictionary * ServerDescriptionHelper::FromNapiObject(Napi::Object serverDescription)
{
  NSMutableDictionary * dictionary = [[NSMutableDictionary alloc] init];
  [dictionary setObject:[NSString stringWithUTF8String:serverDescription.Get("SyphonServerDescriptionAppNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionAppNameKey];
  [dictionary setObject:[NSString stringWithUTF8String:serverDescription.Get("SyphonServerDescriptionNameKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionNameKey];
  [dictionary setObject:[NSString stringWithUTF8String:serverDescription.Get("SyphonServerDescriptionUUIDKey").As<Napi::String>().Utf8Value().c_str()] forKey:SyphonServerDescriptionUUIDKey];
  [dictionary setObject:[NSNumber numberWithUnsignedInt:serverDescription.Get("SyphonServerDescriptionDictionaryVersionKey").As<Napi::Number>().Uint32Value()] forKey:@"SyphonServerDescriptionDictionaryVersionKey"];

  // TODO: Get from description itself.
  NSDictionary *surfaces = [NSDictionary dictionaryWithObjectsAndKeys: @"SyphonSurfaceTypeIOSurface", @"SyphonSurfaceType", nil];
  [dictionary setObject:[NSArray arrayWithObject:surfaces] forKey:@"SyphonServerDescriptionSurfacesKey"];

  NSDictionary * copy = [dictionary copy];
  [dictionary release];

  return copy;
}