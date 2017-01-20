var path = require('path');

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js'
  },
  devtool: "source-map",
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {test: /\.(ts|tsx)$/, loader: 'babel-loader!ts-loader'},
    {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: true,
          presets: ['es2015', 'stage-0']
        }
      } 
     
         ]
  }
};

module.exports = config;
