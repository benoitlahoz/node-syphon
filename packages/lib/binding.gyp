{
    'targets': [
        {
            'target_name': 'syphon',
            'cflags!': ['-fno-exceptions'],
            'cflags_cc!': ['-fno-exceptions'],
            'cflags+': ['-f-exceptions', '-frtti'],
            'cflags_cc+': ['-f-exceptions', '-frtti'],
            'sources': [
                # Helpers.
                "<!@(node -p \"require('fs').readdirSync('./src/obj-cpp/helpers').map(f=>'src/obj-cpp/helpers/'+f).join(' ')\")",
                # Classes.
                "<!@(node -p \"require('fs').readdirSync('./src/obj-cpp/classes').map(f=>'src/obj-cpp/classes/'+f).join(' ')\")",
                # Main.
                "<!@(node -p \"require('fs').readdirSync('./src/obj-cpp').map(f=>'src/obj-cpp/'+f).join(' ')\")",
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
                        'CLANG_CXX_LIBRARY': 'libc++',
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
                        'libraries': [
                            '-Wl', 
                            '-rpath', 
                            '-Fdist/Frameworks', 
                            '<(module_root_dir)/dist/Frameworks/', 
                            '@loader_path/../Frameworks/'
                        ]
                    },
                    # See: https://github.com/ucloud/urtc-electron-demo/blob/master/binding.gyp
                    'mac_framework_dirs': [
                        '<!(pwd)/dist/Frameworks/'
                    ],
                    'link_settings': {
                        'libraries': [
                            "Syphon.framework",
                            "Foundation.framework",
                            'Cocoa.framework',
                            'OpenGL.framework',
                            'Metal.framework'
                        ]
                    }
                }]
            ]
        }
    ]
}
