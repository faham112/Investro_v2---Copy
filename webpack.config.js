const path = require('path');
const glob = require('glob');

module.exports = {
  entry: glob.sync('./js/**/*.js').reduce((acc, path) => {
    const entryName = path.replace(/^.\/js\/(.*).js$/, '$1');
    acc[entryName] = path;
    return acc;
  }, {}),
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    alias: {
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app'),
    },
  },
  mode: 'development',
};
