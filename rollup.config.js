import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'StopCascadeWebContainer'
    },
    plugins: [
        typescript(),
        resolve(),
        commonjs(),
        babel(),
        terser()
    ]
  };