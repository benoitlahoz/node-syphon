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
                # Helpers.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/helpers').map(f=>'src/addon/helpers/'+f).join(' ')\")",
                # Directory.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/directory').map(f=>'src/addon/directory/'+f).join(' ')\")",
                # Client.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/client').map(f=>'src/addon/client/'+f).join(' ')\")",
                # Server.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/server').map(f=>'src/addon/server/'+f).join(' ')\")",
                # Promises.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/promises').map(f=>'src/addon/promises/'+f).join(' ')\")",
                # Listeners.
                "<!@(node -p \"require('fs').readdirSync('./src/addon/event-listeners').map(f=>'src/addon/event-listeners/'+f).join(' ')\")",
                # Main.
                "<!@(node -p \"require('fs').readdirSync('./src/addon').map(f=>'src/addon/'+f).join(' ')\")",
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
                    'architecture': ['x86_64', 'arm64'],
                    'xcode_settings': {
                        'CLANG_CXX_LIBRARY': 'libc++',
                        'MACOSX_DEPLOYMENT_TARGET': '10.15',
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                        'GCC_ENABLE_CPP_RTTI': 'YES',
                        'GCC_SYMBOLS_PRIVATE_EXTERN': 'YES',
                        'OTHER_CFLAGS': [
                            '-ObjC++'
                        ],
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
