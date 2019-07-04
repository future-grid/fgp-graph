const path = require('path');
module.exports = {
    entry: {
        'fgp-graphs.js': './src/fgp-graphs.js',
    },
    output: {
        filename: '[name].bundle.min.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    externals: {
        dygraphs: 'Dygraph'
    },
    devtool: 'source-map'
};
