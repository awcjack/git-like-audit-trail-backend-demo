import babel from '@rollup/plugin-babel'
import eslint from '@rollup/plugin-eslint'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'bundle.js',
      format: 'cjs'
    }
  ],
  plugins: [
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**'
    }),
    eslint({})
  ],
};
