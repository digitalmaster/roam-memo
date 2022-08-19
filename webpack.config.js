const path = require('path');
module.exports = {
  entry: './src/extension.js',
  externalsType: 'window',
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src/'),
    },
  },
  externals: {
    react: 'React',
    'chrono-node': 'ChronoNode',
    '@blueprintjs/core': ['Blueprint', 'Core'],
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
