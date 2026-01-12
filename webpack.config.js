const webpack = require('@nativescript/webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = env => {
  webpack.init(env);

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  const config = webpack.resolveConfig();

  if (env.production || env.uglify) {
    config.optimization = config.optimization || {};
    config.optimization.minimizer = [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 2020,
          module: true,
          toplevel: false,
          keep_classnames: false,
          keep_fnames: false,
          compress: {
            passes: 3,
            drop_console: false,
            drop_debugger: true,
            collapse_vars: false,
            sequences: false,
          },
          mangle: {
            safari10: true,
          },
          output: {
            comments: false,
            semicolons: true,
            ecma: 2020,
          },
        },
        extractComments: false,
      }),
    ];
  }

  return config;
};
