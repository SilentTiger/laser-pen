const path = require('path')
const os = require('os')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ESBuildMinifyPlugin } = require('esbuild-loader')

console.log(`run on ${os.cpus().length} CPUs`)

const webpackConfig = {
  entry: {
    index: './src/index.ts',
    demo: './example/index.ts',
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  devtool: 'source-map',
  devServer: {
    hot: true,
  },
  mode: 'development',
  cache: {
    type: 'filesystem',
  },
  plugins:
    process.env.NODE_ENV !== 'production'
      ? [
          new HtmlWebpackPlugin({
            template: 'example/template.ejs',
            buildTime: new Date().toLocaleString(),
            env: process.env.NODE_ENV,
          }),
        ]
      : [],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'es6',
        },
      },
    ],
  },
}

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'demo') {
  webpackConfig.optimization = {
    minimize: true,
    minimizer: [
      new ESBuildMinifyPlugin({
        target: 'es6',
      }),
    ],
  }
  webpackConfig.mode = 'production'
  webpackConfig.cache = false
  delete webpackConfig.devtool
  webpackConfig.plugins.unshift(new CleanWebpackPlugin())
}

if (process.env.NODE_ENV === 'production') {
  delete webpackConfig.entry.demo
} else {
  delete webpackConfig.entry.index
}

module.exports = webpackConfig
