const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: { filename: 'bundle.js', path: path.resolve(__dirname, 'dist') },
  module: { rules: [{ test: /\.(js|jsx)$/, exclude: /node_modules/, use: { loader: 'babel-loader' } }] },
  resolve: { extensions: ['.js', '.jsx'] },
  // A plain web target: the renderer runs with contextIsolation and no Node APIs.
  target: 'web',
  devtool: 'source-map',
  performance: { hints: false },
  devServer: {
    port: 5180,
    static: [{ directory: path.resolve(__dirname, 'public') }],
    devMiddleware: { publicPath: '/dist/' },
    client: { overlay: { warnings: false } },
  },
};
