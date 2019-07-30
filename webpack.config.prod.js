const path = require('path');
module.exports = {
    entry: {
        'fgp-graph.min': './src/index.ts'
    },
    devtool: 'source-map',
    devServer: {
        contentBase: './dist'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    externals:{
        'dygraphs': 'Dygraph'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].js',
        library: 'lib',
        libraryTarget: "umd",
        path: path.resolve(__dirname, 'dist')
    }
};