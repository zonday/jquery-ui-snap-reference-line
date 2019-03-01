import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import { uglify } from "rollup-plugin-uglify";

function getConfigOptions({
  entry,
  dest,
  env,
}) {
  const plugins = [
      resolve(),
      commonjs(),
      buble(),
  ];
  if (env === 'production') {
    plugins.push(uglify());
  }
  return {
    input: entry,
    output: {
      file: dest,
      format: 'umd',
      globals: {
        jquery: 'jQuery',
      },
    },
    external: [
      'jquery',
    ],
    plugins,
  };
}

const builds = {
  'dev': {
    entry: './src/index.js',
    dest: './dist/jquery-ui-snap-ref-line.js',
  },
  'prod': {
    entry: './src/index.js',
    dest: './dist/jquery-ui-snap-ref-line.min.js',
    env: 'production',
  }
}

let options;
if (process.env.TARGET && builds[process.env.TARGET]) {
  options = getConfigOptions(builds[process.env.TARGET]); 
} else {
  options = Object.keys(builds).map((key) => getConfigOptions(builds[key]));
}

export default options;