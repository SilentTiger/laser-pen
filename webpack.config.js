const path = require('path')
const os = require('os')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

console.log(`run on ${os.cpus().length} CPUs`)

const webpackConfig = {
  entry: {
    index: './src/index.ts',
    main: './example/main.ts',
    client: './example/client.ts',
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
            filename: 'main.html',
            template: 'example/main.ejs',
            buildTime: new Date().toLocaleString(),
            env: process.env.NODE_ENV,
          }),
          new HtmlWebpackPlugin({
            filename: 'client.html',
            template: 'example/client.ejs',
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
        loader: 'ts-loader',
      },
    ],
  },
}

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'demo') {
  webpackConfig.mode = 'production'
  webpackConfig.cache = false
  delete webpackConfig.devtool
  webpackConfig.plugins.unshift(new CleanWebpackPlugin())
}

if (process.env.NODE_ENV === 'production') {
  delete webpackConfig.entry.main
  delete webpackConfig.entry.client
} else {
  delete webpackConfig.entry.index
}

module.exports = webpackConfig
