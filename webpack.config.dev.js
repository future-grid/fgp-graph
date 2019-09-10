const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    entry: {
        'fgp-graph': './src/index.ts'
    },
    devtool: 'source-map', //inline-source-map
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [{ loader: 'ts-loader' }],
                exclude: /node_modules/
            }
        ]
    },
    externals: {
        dygraphs: 'Dygraph',
        moment: 'moment',
        timezone: 'moment-timezone',
        tz: 'moment-timezone'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                include: /\.min\.js$/
            })
        ]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: 'FgpGraph',
        libraryTarget: 'commonjs',
        umdNamedDefine: true,
        globalObject: "(typeof self !== 'undefined' ? self : this)"
    }
};
