#ifndef ___NODE_SYPHON_MACROS_H___
#define ___NODE_SYPHON_MACROS_H___

#pragma mark Checks

#define IS_POINT(value) (value.IsObject() && value.As<Napi::Object>().Has("x") && value.As<Napi::Object>().Has("y"))

#define IS_SIZE(value) (value.IsObject() && value.As<Napi::Object>().Has("width") && value.As<Napi::Object>().Has("height"))

#define IS_RECT(value) (IS_POINT(value) && IS_SIZE(value))

#define IS_UINT8_CLAMPED_ARRAY(value) (value.IsTypedArray() && value.As<Napi::TypedArray>().TypedArrayType() == napi_uint8_clamped_array)

#define IS_NUMBER(value) (value.IsNumber())

#define IS_BUFFER(value) (value.IsBuffer())

#define IS_TEXTURE_TARGET(value) (value.IsString() && (value.As<Napi::String>().Utf8Value() == "GL_TEXTURE_RECTANGLE_EXT" || value.As<Napi::String>().Utf8Value() == "GL_TEXTURE_2D"))

#define IS_SERVER_DESCRIPTION(value) value.Has("SyphonServerDescriptionAppNameKey") && \
                                     value.Has("SyphonServerDescriptionNameKey") && \
                                     value.Has("SyphonServerDescriptionUUIDKey") && \
                                     value.Has("SyphonServerDescriptionDictionaryVersionKey") && \
                                     value.Has("SyphonServerDescriptionSurfacesKey")

#pragma mark Converters

#define TO_C_STRING(value) value.As<Napi::String>().Utf8Value().c_str()

#define TO_NSSTRING(value) [NSString stringWithUTF8String:TO_C_STRING(value)]

#endif