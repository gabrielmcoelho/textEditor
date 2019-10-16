const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const publicPath = '/';

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'js/editor.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: publicPath,
        libraryTarget: 'commonjs2'
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "css/editor.css"
        })
    ],
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /(node_modules)/,
                use: 'babel-loader',
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader'
                ]
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
};
