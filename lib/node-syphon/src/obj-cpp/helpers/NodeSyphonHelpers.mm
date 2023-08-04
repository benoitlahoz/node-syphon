#import "NodeSyphonHelpers.h"

@implementation NodeSyphonHelpers

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
    uint8_t * buffer = [NodeSyphonHelpers imageToBuffer:[description objectForKey:SyphonServerDescriptionIconKey]];

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