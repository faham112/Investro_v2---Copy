const path = require('path');

module.exports = {
  entry: './js/login.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      'firebase/app': path.resolve(__dirname, 'node_modules/firebase/app'),
    },
  },
  mode: 'development',
};
