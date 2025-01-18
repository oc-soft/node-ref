{
  'targets': [
    {
      'target_name': 'binding',
      'sources': [ 'src/binding.cc' ],
      'include_dirs': [
        '<!(node -e "require(\'nan\')")'
      ],
      'conditions': [
        [ 
          'OS == "linux"',
          {
            'cflags': [
              '-Wno-class-memaccess',
              '-std=c++20'
            ] 
          }
        ],
        [
          'OS == "win"',
          {
            'msvs_settings': {
              'VCCLCompilerTool': {
                'AdditionalOptions': [ '/std:c++20' ]
              }
            }
          }
        ]
      ]
    }
  ]
}
