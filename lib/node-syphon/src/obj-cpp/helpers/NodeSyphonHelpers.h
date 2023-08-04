#ifndef ___NODE_SYPHON_HELPERS_H___
#define ___NODE_SYPHON_HELPERS_H___

#include <napi.h>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
#import <OpenGL/OpenGL.h>
#import <Syphon/Syphon.h>

#include <OpenGL/gl.h>

@interface NodeSyphonHelpers : NSObject

+ (Napi::Object)serverDescription:(NSDictionary *)description info:(const Napi::CallbackInfo &)info;

+ (uint8_t *)imageToBuffer:(NSImage *)image;

@end

#endif