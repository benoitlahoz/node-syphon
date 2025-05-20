{
    'targets': [
        {
            'target_name': 'syphon',
            'cflags!': ['-fno-exceptions'],
            # https://github.com/nodejs/node-addon-api/issues/1229#issuecomment-1307613279
            'cflags_cc!': ['-fno-exceptions', '-03'],
            'cflags+': ['-f-exceptions', '-frtti', '-03'],
            'cflags_cc+': ['-f-exceptions', '-frtti', '-03'],
            'sources': [
                # General Helpers
                './src/addon/helpers/macros.h',
                './src/addon/helpers/ServerDescriptionHelper.h',
                './src/addon/helpers/ServerDescriptionHelper.mm',
                
                # Directory
                './src/addon/directory/ServerDirectory.h',
                './src/addon/directory/ServerDirectory.mm',

                # OepnGL
                './src/addon/opengl/OpenGLClient.h',
                './src/addon/opengl/OpenGLClient.mm',
                './src/addon/opengl/OpenGLHelper.h',
                './src/addon/opengl/OpenGLHelper.mm',
                './src/addon/opengl/OpenGLServer.h',
                './src/addon/opengl/OpenGLServer.mm',

                # Metal
                './src/addon/metal/MetalClient.h',
                './src/addon/metal/MetalClient.mm',
                './src/addon/metal/MetalServer.h',
                './src/addon/metal/MetalServer.mm',

                # Workers
                './src/addon/promises/NSRunLoopPromiseWorker.h',
                './src/addon/promises/PixelBufferPromiseWorker.h',
                './src/addon/promises/PromiseWorker.h',
                './src/addon/promises/PromiseWorker.mm',

                # Event Listeners
                './src/addon/event-listeners/DirectoryEventListener.h',
                './src/addon/event-listeners/DirectoryEventListener.mm',
                './src/addon/event-listeners/FrameEventListener.h',
                './src/addon/event-listeners/FrameEventListener.mm',
                './src/addon/event-listeners/TextureEventListener.h',
                './src/addon/event-listeners/TextureEventListener.mm',
                './src/addon/event-listeners/StringEventListener.h',
                './src/addon/event-listeners/StringEventListener.mm',

                # Main
                './src/addon/main.h',
                './src/addon/main.mm',
            ],
            'include_dirs': [
                "<!@(node -p \"require('node-addon-api').include\")"
            ],
            'dependencies': [
                "<!(node -p \"require('node-addon-api').gyp\")"
            ],
            'defines': [
                'NAPI_CPP_EXCEPTIONS',
                'NODE_API_NO_EXTERNAL_BUFFERS_ALLOWED'
            ],
            'conditions': [
                ['OS=="mac"', {
                    "defines": [
                        "__MACOSX_CORE__"
                    ],
                    'xcode_settings': {
                        'ARCHS': ['x86_64', 'arm64'],
                        'CLANG_CXX_LIBRARY': 'libc++',
                        'MACOSX_DEPLOYMENT_TARGET': '10.15',
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                        'GCC_ENABLE_CPP_RTTI': 'YES',
                        'GCC_SYMBOLS_PRIVATE_EXTERN': 'YES',
                        'OTHER_CFLAGS': [],
                        "LD_RUNPATH_SEARCH_PATHS": [
                            # TODO: Is this useful?
                            "@loader_path/../Frameworks",
                            "@executable_path/../Frameworks"
                        ]
                    },
                    'link_settings': {
                        'libraries': [
                            # Replace @rpath by @loader_path will load Syphon.framework from 'dist/Frameworks'
                            # @see https://stackoverflow.com/questions/42512623/how-to-build-nodejs-c-addon-depending-on-a-shared-library-with-relative-locati
                            "-Wl,-rpath,'@loader_path/../Frameworks'",
                            'IOSurface.framework',
                            "Syphon.framework",
                            "Foundation.framework",
                            'Cocoa.framework',
                            'OpenGL.framework',
                            'Metal.framework',
                            'Accelerate.framework'
                        ],
                    },
                    # Where to find framework at build time.
                    'mac_framework_dirs': [
                        '<!(pwd)/lib/'
                    ]
                }]
            ]
        }
    ]
}
