const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const findUp = require('find-up');

let extractCssInitialized = false;

module.exports = (nextConfig = {}) => {
  return Object.assign({}, nextConfig, {
    webpack(config, options) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        );
      }

      const { dev, isServer } = options;
      const { cssModules, cssLoaderOptions, postcssLoaderOptions } = nextConfig;

      if (!isServer) {
        config.optimization.splitChunks.cacheGroups.styles = {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        };
      }

      if (!isServer && !extractCssInitialized) {
        config.plugins.push(
          new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: dev
              ? 'static/css/[name].css'
              : 'static/css/[name].[contenthash:8].css',
            chunkFilename: dev
              ? 'static/css/[name].chunk.css'
              : 'static/css/[name].[contenthash:8].chunk.css',
            ignoreOrder: true,
          })
        );
        extractCssInitialized = true;
      }

      const cssLoader = {
        loader: 'css-loader',
        options: Object.assign(
          {},
          {
            modules: cssModules,
            sourceMap: dev,
            importLoaders: loaders.length + (postcssLoader ? 1 : 0),
          },
          cssLoaderOptions
        ),
      };

      const postcssConfig = findUp.sync(
        ['postcss.config.js', '.postcssrc', '.postcssrc.js', '.postcssrc.json'],
        {
          cwd: config.context,
        }
      );
      const postcssOptionsConfig = Object.assign(
        {},
        postcssLoaderOptions.postcssOptions,
        {
          path: postcssConfig,
        }
      );

      const postcssLoader = postcssConfig && {
        loader: 'postcss-loader',
        options: Object.assign({}, postcssLoaderOptions, {
          postcssOptions: postcssOptionsConfig,
        }),
      };

      options.defaultLoaders.css = isServer
        ? ['ignore-loader']
        : [
            dev && 'extracted-loader',
            MiniCssExtractPlugin.loader,
            cssLoader,
            postcssLoader,
          ].filter(Boolean);

      config.module.rules.push({
        test: /\.css$/,
        use: options.defaultLoaders.css,
      });

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  });
};
