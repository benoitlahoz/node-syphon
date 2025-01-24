# node-syphon

## Build

In Syphon Framework's XCode project:

- Replace the _Dynamic Library Install Name_ property with this `@loader_path/../Frameworks/$(EXECUTABLE_PATH)`
- Replace the _Dynamic Library Install Name Base_ property with this `@rpath`
- Enable automatic signing with your Apple Developper profile
