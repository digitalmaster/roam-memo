const path = require('path');
module.exports = {
  entry: './src/extension.js',
  externalsType: 'window',
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/'),
    },
    extensions: ['.js', '.jsx'],
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    'chrono-node': 'ChronoNode',
    '@blueprintjs/core': ['Blueprint', 'Core'],
    '@blueprintjs/select': ['Blueprint', 'Select'],
  },
  output: {
    filename: 'extension.js',
    path: __dirname,
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
