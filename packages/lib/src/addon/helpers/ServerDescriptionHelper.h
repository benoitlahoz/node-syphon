#ifndef __SERVER_DESCRIPTION_HELPER_H__
#define __SERVER_DESCRIPTION_HELPER_H__

#include <napi.h>
#include <Foundation/Foundation.h>
#include <Cocoa/Cocoa.h>
#include <Syphon/Syphon.h>

namespace syphon
{
  class ServerDescriptionHelper : public Napi::ObjectWrap<ServerDescriptionHelper>
  {
    public:
      static Napi::Object ToNapiObject(NSDictionary * serverDescription, const Napi::CallbackInfo & info);
      static NSDictionary * FromNapiObject(Napi::Object serverDescription);
  };
}
#endif