import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import buble from 'rollup-plugin-buble';
import { uglify } from "rollup-plugin-uglify";

const pkg  = require('./package.json');

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
    plugins.push(uglify({
      output: {
        comments: function (node, comment) {
          if (comment.type === "comment2") {
            // multiline comment
            return /@version/i.test(comment.value);
          }
          return false;
        }
      }
    }));
  }
  return {
    input: entry,
    output: {
      file: dest,
      format: 'umd',
      globals: {
        jquery: 'jQuery',
      },
      banner: `
/**
@version ${pkg.version}${env!== 'production' ? '-dev' : ''}
*/
      `,
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