const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  entry: './src/extension.tsx',
  externalsType: 'window',
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
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
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
};
