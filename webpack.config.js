const path = require('path');

module.exports = {
  entry: './src/client/index.js',
  mode: 'development',
  profile: true,
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'public/build'),
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      },
    ],
  },
}