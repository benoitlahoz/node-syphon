#import "NodeSyphonHelpers.h"

@implementation NodeSyphonHelpers

// Thanks to https://stackoverflow.com/questions/61035830/how-to-create-an-opengl-context-on-an-nodejs-native-addon-on-macos
+ (CGLContextObj) createCGLContextWithInfo:(const Napi::CallbackInfo &)info {

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);
  
  CGLContextObj context;

  CGLPixelFormatAttribute attributes[3] = {
    kCGLPFAAccelerated, 
    kCGLPFANoRecovery,
    // kCGLPFADoubleBuffer,
    (CGLPixelFormatAttribute) 0
  };

  CGLPixelFormatObj pix;

  CGLError errorCode;

  GLint num; // Stores the number of possible pixel formats

  errorCode = CGLChoosePixelFormat( attributes, &pix, &num );

  if (errorCode > 0) {
    // TODO: CGLError to string.
    Napi::Error::New(env, "choosePixelFormat returned an error").ThrowAsJavaScriptException();
  }

  errorCode = CGLCreateContext(pix, NULL, &context);
  if (errorCode > 0) {
    Napi::Error::New(env, "CGLCreateContext returned an error").ThrowAsJavaScriptException();
  }

  CGLDestroyPixelFormat(pix);

  return context;
}

// WARNING: It's up to the caller to delete the created buffer.
+ (uint8_t *) bufferWithOpenGLFrame:(SyphonOpenGLImage *)frame {

  size_t width = [frame textureSize].width;
  size_t height = [frame textureSize].height;

  uint8_t* pixelBuffer = new uint8_t[width * height * 4];
  std::memset(pixelBuffer, 0, width * height * 4);

  GLuint fbo;

  CGLLockContext(CGLGetCurrentContext());
  
  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_RECTANGLE, [frame textureName], 0);

  glBindTexture(GL_TEXTURE_RECTANGLE, [frame textureName]);

  glViewport(0, 0, width, height);
  glClearColor(0.0f, 0.0f, 0.0f, 0.0f);
  // glClear(GL_COLOR_BUFFER_BIT); 

  glEnable(GL_TEXTURE_RECTANGLE);
  glDisable(GL_DEPTH_TEST);

  glBindTexture(GL_TEXTURE_RECTANGLE, [frame textureName]);

  glBegin(GL_QUADS);
  
  glTexCoord2f(0.0f, 0.0f); glVertex2f(-1.0f, -1.0f);
  glTexCoord2f(width, 0.0f); glVertex2f(1.0f, -1.0f);
  glTexCoord2f(width, height); glVertex2f(1.0f, 1.0f);
  glTexCoord2f(0.0f, height); glVertex2f(-1.0f, 1.0f);

  glEnd();

  glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, pixelBuffer);

  glBindTexture(GL_TEXTURE_RECTANGLE, 0);
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glDeleteFramebuffers(1, &fbo);

  [frame release];
  CGLUnlockContext(CGLGetCurrentContext());

  return pixelBuffer;
}

/**
 * Creates a Napi::Object with a server description NSDictionary.
 */
+ (Napi::Object)serverDescription:(NSDictionary *)description info:(const Napi::CallbackInfo &)info {

  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  // NSLog(@"%@", description);

  Napi::Object obj = Napi::Object::New(env);

  if ([description objectForKey:SyphonServerDescriptionNameKey])
    obj.Set("SyphonServerDescriptionNameKey", [[description objectForKey:SyphonServerDescriptionNameKey] UTF8String]);

  if ([description objectForKey:SyphonServerDescriptionAppNameKey])
    obj.Set("SyphonServerDescriptionAppNameKey", [[description objectForKey:SyphonServerDescriptionAppNameKey] UTF8String]);

  if ([description objectForKey:SyphonServerDescriptionUUIDKey])
    obj.Set("SyphonServerDescriptionUUIDKey", [[description objectForKey:SyphonServerDescriptionUUIDKey] UTF8String]);

  if ([description objectForKey:SyphonServerDescriptionIconKey]) {
    // obj.Set("SyphonServerDescriptionIconKey", [[description objectForKey:SyphonServerDescriptionIconKey] UTF8String]);
    NSImage *icon = [description objectForKey:SyphonServerDescriptionIconKey];
    uint8_t * buffer = [NodeSyphonHelpers imageToBuffer:[description objectForKey:SyphonServerDescriptionIconKey]];
    Napi::Value result = Napi::ArrayBuffer::New(env, buffer, icon.size.width * icon.size.height * 4);
    obj.Set("SyphonServerDescriptionIconKey", result);
    delete [] buffer;
  }

  return obj;
}

// https://stackoverflow.com/a/43232455/1060921
+ (uint8_t *)imageToBuffer:(NSImage *)image {
  if (!image) {
    return NULL;
  }
  
  // Dimensions - source image determines context size

  NSSize imageSize = image.size;
  NSRect imageRect = NSMakeRect(0, 0, imageSize.width, imageSize.height);

  // Create a context to hold the image data

  CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceGenericRGB);

  CGContextRef ctx = CGBitmapContextCreate(NULL,
                                          imageSize.width,
                                          imageSize.height,
                                          8,
                                          0,
                                          colorSpace,
                                          kCGImageAlphaPremultipliedLast);

  // Wrap graphics context

  NSGraphicsContext *gctx = [NSGraphicsContext graphicsContextWithCGContext:ctx flipped:NO];

  // Make our bitmap context current and render the NSImage into it

  [NSGraphicsContext setCurrentContext:gctx];
  [image drawInRect:imageRect];

  size_t width = CGBitmapContextGetWidth(ctx);
  size_t height = CGBitmapContextGetHeight(ctx);


  // Fill th buffer with image data.

  // uint8_t buffer[(uint)image.size.width * (uint)image.size.height * 4];
  uint8_t * buffer = (uint8_t*) calloc((uint)image.size.width * (uint)image.size.height * 4, sizeof(uint8_t));

  uint32_t* pixel = (uint32_t*)CGBitmapContextGetData(ctx);

  int i = 0;
  for (unsigned y = 0; y < height; y++)
  {
      for (unsigned x = 0; x < width; x++)
      {
          uint32_t rgba = *pixel;

          // Extract colour components
          uint8_t red = (rgba & 0x000000ff) >> 0;
          uint8_t green = (rgba & 0x0000ff00) >> 8;
          uint8_t blue = (rgba & 0x00ff0000) >> 16;
          uint8_t alpha = (rgba & 0x00ff0000) >> 24;

          buffer[i] = red;
          buffer[i + 1] = green;
          buffer[i + 2] = blue;
          buffer[i + 3] = alpha;

          printf("%i", buffer[i]);

          // Next pixel!
          pixel++;
          i += 4;
      }
  }

  // Clean up

  [NSGraphicsContext setCurrentContext:nil];
  CGContextRelease(ctx);
  CGColorSpaceRelease(colorSpace);

  // You're responsible for deleting this.

  return buffer;

}

@end