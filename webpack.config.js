const path = require('path')
const os = require('os')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
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
    static: path.resolve(__dirname, 'example'),
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
            filename: 'index.html',
            template: 'example/main.ejs',
            chunks: ['main'],
            buildTime: new Date().toLocaleString(),
            env: process.env.NODE_ENV,
          }),
          new HtmlWebpackPlugin({
            filename: 'client.html',
            template: 'example/client.ejs',
            chunks: ['client'],
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
  if (process.env.NODE_ENV === 'demo') {
    webpackConfig.plugins.push(
      new CopyPlugin({ patterns: [{ from: 'example/simplepeer.min.js', to: 'simplepeer.min.js' }] }),
    )
  }
}

if (process.env.NODE_ENV === 'production') {
  delete webpackConfig.entry.main
  delete webpackConfig.entry.client
} else {
  delete webpackConfig.entry.index
}

module.exports = webpackConfig
