const path = require('path');
const dotenv = require('dotenv');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TransformJson = require('transform-json-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const packageJson = require('./package.json');

dotenv.config();

const mode = process.env.NODE_ENV || 'production';
const isProd = mode === 'production';
const isDev = !isProd;

const srcDir = 'src';
const outDir = 'dist';

const extensionKey = process.env.EXTENSION_KEY;

const base = {
	mode,
	watch: isDev,
	target: 'web',
	devtool: isDev ? 'source-map' : false,
	cache: false,
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					keep_classnames: true,
					keep_fnames: true
				}
			})
		]
	}
};

const _resolve = {
	extensions: ['.ts', '.js', '.cjs'],
	alias: {
		'@': path.resolve(__dirname, srcDir),
		'@shared': path.resolve(__dirname, srcDir, 'shared'),
		'@content': path.resolve(__dirname, srcDir, 'content'),
		'@popup': path.resolve(__dirname, srcDir, 'popup')
	}
};

const _module = {
	rules: [
		{
			test: /\.s[ac]ss$/i,
			use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
		},
		{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: ['@babel/preset-env', '@babel/preset-typescript']
				}
			}
		}
	]
};

module.exports = [
	{
		...base,
		entry: [path.resolve(__dirname, srcDir, 'manifest.json')],
		output: {
			path: path.resolve(__dirname, outDir),
			filename: 'manifest.json'
		},
		plugins: [
			new CopyWebpackPlugin({
				patterns: [
					{
						from: 'static'
					}
				]
			}),
			new TransformJson({
				source: path.resolve(__dirname, srcDir, 'manifest.json'),
				filename: 'manifest.json',
				object: {
					version: packageJson.version,
					key: extensionKey
				}
			}),
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: ['popup.html', 'images', 'manifest.json', 'browser-polyfill.min.js']
			})
		]
	},
	{
		...base,
		entry: [path.resolve(__dirname, srcDir, 'popup', 'popup.ts')],
		output: {
			path: path.resolve(__dirname, outDir),
			filename: path.join('popup.js')
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: 'popup.css'
			}),
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: ['popup.js', 'popup.js.map', 'popup.css', 'popup.css.map']
			})
		],
		resolve: _resolve,
		module: {
			rules: [
				{
					test: /\.s[ac]ss$/i,
					use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
				},
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-typescript']
						}
					}
				}
			]
		}
	},
	{
		...base,
		entry: [path.resolve(__dirname, srcDir, 'background', 'background.ts')],
		output: {
			path: path.resolve(__dirname, outDir),
			filename: path.join('background.js')
		},
		plugins: [
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: ['background.js', 'background.js.map']
			})
		],
		resolve: _resolve,
		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-typescript']
						}
					}
				}
			]
		}
	},
	{
		...base,
		entry: {
			content: path.resolve(__dirname, srcDir, 'content', 'content.ts')
		},
		output: {
			path: path.resolve(__dirname, outDir),
			filename: '[name].js'
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: 'content.css'
			}),
			new CleanWebpackPlugin({
				cleanOnceBeforeBuildPatterns: ['content.js', 'content.js.map', 'content.css', 'content.css.map']
			})
		],
		resolve: _resolve,
		module: {
			rules: [
				{
					test: /\.s[ac]ss$/i,
					use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
				},
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env', '@babel/preset-typescript']
						}
					}
				}
			]
		}
	}
];
