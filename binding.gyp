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
          'OS == "linux"', {
            'cflags': [
              '-Wno-class-memaccess',
              '-std=c++20'
            ] 
          }
        ]
      ]
    }
  ]
}
