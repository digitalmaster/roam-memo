const isTest = String(process.env.NODE_ENV) === 'test'

module.exports = {
  presets: [
    [
      "@babel/preset-react",
      {
        ...(isTest && { runtime: "automatic" })
      }
    ],
    "@babel/preset-env",
    "@babel/preset-typescript"
  ],
}
