var path = require('path');

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
        open: false,
        filename: '[name].bundle.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    externals:{
        'dygraphs': 'Dygraph',
        'moment': 'moment',
        'timezone': 'moment-timezone'
    },
    module: {
        rules: [{
            // Include ts, tsx, js, and jsx files.
            test: /\.(ts|js)x?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
        }],
    }
};