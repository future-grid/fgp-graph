const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
// const MinifyPlugin = require('babel-minify-webpack-plugin');
module.exports = {
    plugins: [
        new CopyPlugin([
            { from: 'src/style/graph.css', to: '../lib/css/graph.css'}
        ])
    ],
    entry: {
        'fgp-graph': './src/index.ts'
    },
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    // plugins: [new MinifyPlugin({})],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    externals: {
        dygraphs: 'Dygraph',
        moment: 'moment',
        timezone: 'moment-timezone'
    },
    module: {
        rules: [
            {
                // Include ts, tsx, js, and jsx files.
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    }
};
