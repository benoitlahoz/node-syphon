# node-syphon

## Build

Add Syphon:
`git submodule update --init`

In Syphon Framework's XCode project:

- Replace the _Dynamic Library Install Name_ property with this `@loader_path/../Frameworks/$(EXECUTABLE_PATH)`
- Replace the _Dynamic Library Install Name Base_ property with this `@rpath`
- Remove any signing team
