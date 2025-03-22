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
                    'architecture': 'x86_64',
                    'xcode_settings': {
                        # https://stackoverflow.com/a/39519008/1060921
                        'CLANG_CXX_LIBRARY': 'libc++',
                        # 'CLANG_CXX_LIBRARY': 'libstdc++',
                        'MACOSX_DEPLOYMENT_TARGET': '10.13',
                        'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
                        'GCC_ENABLE_CPP_RTTI': 'YES',
                        'GCC_SYMBOLS_PRIVATE_EXTERN': 'YES',  # -fvisibility=hidden
                        'GCC_PREPROCESSOR_DEFINITIONS': 'SYPHON_CORE_SHARE',
                        'OTHER_CFLAGS': [
                            '-ObjC++'
                        ]
                    },
                    'link_settings': {
                        # SEEEEEE https://stackoverflow.com/questions/42512623/how-to-build-nodejs-c-addon-depending-on-a-shared-library-with-relative-locati
                        'libraries': [
                            '-Wl', 
                            '-rpath', 
                            '-Fdist/Frameworks', 
                            # '@loader_path/../Frameworks/',  # No such file or directory at build time.
                            # '<!(pwd)/node_modules/node-syphon/dist/Frameworks/',  # No such file or directory at build time.
                            # '<(module_root_dir)/dist/Frameworks/'
                            "-Wl,-rpath,<!(pwd)/dist/Frameworks/"
                            'IOSurface.framework',
                            # "Syphon.framework",
                            "Foundation.framework",
                            'Cocoa.framework',
                            'OpenGL.framework',
                            'Metal.framework',
                            'Accelerate.framework'
                        ],
                         "ldflags": [
                             # https://stackoverflow.com/a/42512979/1060921
                             "-rpath", "@loader_path/../Frameworks"
                        ]
                    },
                    # See: https://github.com/ucloud/urtc-electron-demo/blob/master/binding.gyp
                    'mac_framework_dirs': [
                        '<!(pwd)/dist/Frameworks/',
                        # FIXME: Necessary?
                        '<!(pwd)/node_modules/node-syphon/dist/Frameworks/'
                    ],
                     "LD_RUNPATH_SEARCH_PATHS": [
                        "@loader_path/../Frameworks",
                        "@executable_path/../Frameworks",
                        "/Library/Frameworks"
                    ]
                }]
            ]
        }
    ]
}
