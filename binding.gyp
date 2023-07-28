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
                "<!@(node -p \"require('fs').readdirSync('./src/lib/helpers').map(f=>'src/lib/helpers/'+f).join(' ')\")",
                # Classes.
                "<!@(node -p \"require('fs').readdirSync('./src/lib/classes').map(f=>'src/lib/classes/'+f).join(' ')\")",
                # Main.
                "<!@(node -p \"require('fs').readdirSync('./src/lib').map(f=>'src/lib/'+f).join(' ')\")",
            ],
            'include_dirs': [
                "<!@(node -p \"require('node-addon-api').include\")",
            ],
            'dependencies': [
                "<!(node -p \"require('node-addon-api').gyp\")"
            ],
            'defines': [
                'NAPI_CPP_EXCEPTIONS'
            ],
            'conditions': [
                ['OS=="mac"', {
                    "defines": [
                        "__MACOSX_CORE__"
                    ],
                    'architecture': 'x86_64',
                    'xcode_settings': {
                        'CLANG_CXX_LIBRARY': 'libc++',
                        'MACOSX_DEPLOYMENT_TARGET': '10.11',
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
                            '-Wl', '-rpath', '-Fframework/build/', '<(module_root_dir)/frameworks/Syphon/build/Release', '@loader_path/../Frameworks'
                        ]
                    },
                    # See: https://github.com/ucloud/urtc-electron-demo/blob/master/binding.gyp
                    'mac_framework_dirs': [
                        # TODO: Remove this, import Syphon from 'custom' folder (in core.mm) and it works, but interesting for loading in Electron. Add other path?
                        '<!(pwd)/frameworks/Syphon/build/Release/'
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
