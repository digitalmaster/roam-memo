module.exports = {
  entry: "./src/extension.js",
  externals: {
    react: "React",
    "chrono-node": "ChronoNode",
  },
  output: {
    filename: "extension.js",
    path: __dirname,
    library: {
      type: "module",
    },
  },
  externalsType: "window",
  experiments: {
    outputModule: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
};
