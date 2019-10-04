const path = require('path');
// const MinifyPlugin = require('babel-minify-webpack-plugin');
module.exports = {
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
