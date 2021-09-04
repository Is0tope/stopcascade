import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

export default {
    input: 'out/index.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'StopCascadeWebContainer'
    },
    plugins: [
        resolve(),
        commonjs(),
        babel()
    ]
  };