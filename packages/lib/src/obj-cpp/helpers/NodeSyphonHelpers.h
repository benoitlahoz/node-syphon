#ifndef ___NODE_SYPHON_HELPERS_H___
#define ___NODE_SYPHON_HELPERS_H___

#include <napi.h>
#include <OpenGL/gl.h>
#include <OpenGL/gl3.h>

#import <Foundation/Foundation.H>
#import <Cocoa/Cocoa.h>
#import <OpenGL/OpenGL.h>
#import <Syphon/Syphon.h>



@interface NodeSyphonHelpers : NSObject

+ (CGLContextObj)createCGLContextWithInfo:(const Napi::CallbackInfo &)info;

+ (uint8_t *)bufferWithOpenGLFrame:(SyphonOpenGLImage *)frame;

+ (Napi::Object)
    serverDescription:(NSDictionary *)description
                 info:(const Napi::CallbackInfo &)info;

+ (uint8_t *)imageToBuffer:(NSImage *)image;

@end

#endif