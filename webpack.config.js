const path = require('path');
module.exports = {
    entry: {
        'fgp-graph': './src/demo.ts'
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        compress: true,
        port: 8000,
        clientLogLevel: 'debug',
        open: true
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
        'dygraphs': 'Dygraph',
        'moment': 'moment',
        'timezone': 'moment-timezone'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    exclude: [
		"**/__tests__/*",
		"node_modules"
	],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    }
};