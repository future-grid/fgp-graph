const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
// const MinifyPlugin = require('babel-minify-webpack-plugin');
module.exports = {
    plugins: [
        new CopyPlugin([
            { from: 'src/style/graph.css', to: '../lib/css/graph.css'},
            { from: 'src/style/graph.css', to: '../demo/css/graph.css'}
        ])
    ],
    entry: {
        'fgp-graph-demo': './src/demo.ts',
        'fgp-graph': './src/index.ts'
    },
    devtool: 'source-map',
    devServer: {
        contentBase: [path.join(__dirname, 'demo')],
        compress: true,
        clientLogLevel: 'debug',
        open: true,
        filename: '[name].bundle.js',
        // noInfo: true
    },
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
        timezone: 'moment-timezone',
        //html2canvas: 'html2canvas'
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
