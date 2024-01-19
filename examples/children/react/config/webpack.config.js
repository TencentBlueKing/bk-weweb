'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const resolve = require('resolve');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ESLintPlugin = require('eslint-webpack-plugin');
const paths = require('./paths');
const modules = require('./modules');
const getClientEnvironment = require('./env');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const ForkTsCheckerWebpackPlugin =
  process.env.TSC_COMPILE_ON_ERROR === 'true'
    ? require('react-dev-utils/ForkTsCheckerWarningWebpackPlugin')
    : require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const createEnvironmentHash = require('./webpack/persistentCache/createEnvironmentHash');

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';

const reactRefreshRuntimeEntry = require.resolve('react-refresh/runtime');
const reactRefreshWebpackPluginRuntimeEntry = require.resolve('@pmmmwh/react-refresh-webpack-plugin');
const babelRuntimeEntry = require.resolve('babel-preset-react-app');
const babelRuntimeEntryHelpers = require.resolve('@babel/runtime/helpers/esm/assertThisInitialized', {
  paths: [babelRuntimeEntry],
});
const babelRuntimeRegenerator = require.resolve('@babel/runtime/regenerator', {
  paths: [babelRuntimeEntry],
});

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';

const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin = true;

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000');

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);

// Check if Tailwind config exists
const useTailwind = fs.existsSync(path.join(paths.appPath, 'tailwind.config.js'));

// Get the path to the uncompiled service worker (if it exists).
const swSrc = paths.swSrc;

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');

  // We will provide `paths.publicUrlOrPath` to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const shouldUseReactRefresh = env.raw.FAST_REFRESH;

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            config: false,
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            plugins: !useTailwind
              ? [
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    },
                  ],
                  // Adds PostCSS Normalize as the reset css with default options,
                  // so that it honors browserslist config in package.json
                  // which in turn let's users customize the target behavior as per their needs.
                  'postcss-normalize',
                ]
              : [
                  'tailwindcss',
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    },
                  ],
                ],
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            root: paths.appSrc,
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        },
      );
    }
    return loaders;
  };

  return {
    // Stop compilation early in production
    bail: isEnvProduction,
    cache: {
      buildDependencies: {
        config: [__filename],
        defaultWebpack: ['webpack/lib/'],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f => fs.existsSync(f)),
      },
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      type: 'filesystem',
      version: createEnvironmentHash(env.raw),
    },
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',
    // This means they will be the "root" imports that are included in JS bundle.
    entry: paths.appIndexJs,
    infrastructureLogging: {
      level: 'none',
    },
    // These are the "entry points" to our application.
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    module: {
      rules: [
        // Handle node_modules packages that contain sourcemaps
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          loader: require.resolve('source-map-loader'),
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // TODO: Merge this config once `image/avif` is in the mime-db
            // https://github.com/jshttp/mime-db
            {
              mimetype: 'image/avif',
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
              test: [/\.avif$/],
              type: 'asset',
            },
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: 'asset',
            },
            {
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve('@svgr/webpack'),
                  options: {
                    prettier: false,
                    ref: true,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                  },
                },
                {
                  loader: require.resolve('file-loader'),
                  options: {
                    name: 'static/media/[name].[hash].[ext]',
                  },
                },
              ],
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              include: paths.appSrc,
              loader: require.resolve('babel-loader'),
              options: {
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                // directory for faster rebuilds.
                cacheDirectory: true,

                compact: isEnvProduction,
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                plugins: [isEnvDevelopment && shouldUseReactRefresh && require.resolve('react-refresh/babel')].filter(
                  Boolean,
                ),
                presets: [
                  [
                    require.resolve('babel-preset-react-app'),
                    {
                      runtime: hasJsxRuntime ? 'automatic' : 'classic',
                    },
                  ],
                ],
              },
              test: /\.(js|mjs|jsx|ts|tsx)$/,
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                cacheDirectory: true,
                compact: false,
                configFile: false,
                inputSourceMap: shouldUseSourceMap,

                // Babel sourcemaps are needed for debugging into node_modules
                // code.  Without the options below, debuggers like VSCode
                presets: [[require.resolve('babel-preset-react-app/dependencies'), { helpers: true }]],
                // show incorrect code and set breakpoints on the wrong lines.
                sourceMaps: shouldUseSourceMap,
              },
              test: /\.(js|mjs)$/,
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              exclude: cssModuleRegex,
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
              test: cssRegex,
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              use: getStyleLoaders({
                importLoaders: 1,
                modules: {
                  mode: 'icss',
                },
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
              }),
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                modules: {
                  getLocalIdent: getCSSModuleLocalIdent,
                  mode: 'local',
                },
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              exclude: sassModuleRegex,
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
              test: sassRegex,
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  modules: {
                    mode: 'icss',
                  },
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                },
                'sass-loader',
              ),
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  modules: {
                    getLocalIdent: getCSSModuleLocalIdent,
                    mode: 'local',
                  },
                  sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                },
                'sass-loader',
              ),
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: 'asset/resource',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ].filter(Boolean),
      strictExportPresence: true,
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            compress: {
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              ecma: 5,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              warnings: false,
            },
            // Added for profiling in devtools
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            mangle: {
              safari10: true,
            },
            output: {
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              ecma: 5,
            },
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
          },
        }),
        // This is only used in production mode
        new CssMinimizerPlugin(),
      ],
    },
    output: {
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      // There will be one main bundle, and one file per asynchronous chunk.
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : isEnvDevelopment && (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
      // In development, it does not produce real files.
      filename: isEnvProduction ? 'static/js/[name].[contenthash:8].js' : isEnvDevelopment && 'static/js/bundle.js',
      // The build folder.
      path: paths.appBuild,
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: paths.publicUrlOrPath,
    },
    // our own hints via the FileSizeReporter
    performance: false,
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
          },
          isEnvProduction
            ? {
                minify: {
                  collapseWhitespace: true,
                  keepClosingSlash: true,
                  minifyCSS: true,
                  minifyJS: true,
                  minifyURLs: true,
                  removeComments: true,
                  removeEmptyAttributes: true,
                  removeRedundantAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  useShortDoctype: true,
                },
              }
            : undefined,
        ),
      ),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction && shouldInlineRuntimeChunk && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/main/packages/react-refresh
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
          // both options are optional
          filename: 'static/css/[name].[contenthash:8].css',
        }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith('.map'));

          return {
            entrypoints: entrypointFiles,
            files: manifestFiles,
          };
        },
        publicPath: paths.publicUrlOrPath,
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin({
        contextRegExp: /moment$/,
        resourceRegExp: /^\.\/locale$/,
      }),
      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the webpack build.
      isEnvProduction &&
        fs.existsSync(swSrc) &&
        new WorkboxWebpackPlugin.InjectManifest({
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
          exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
          // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // Bump up the default maximum size (2mb) that's precached,
          // to make lazy-loading failure scenarios less likely.
          swSrc,
        }),
      // TypeScript type checking
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupProxy.*' },
              { file: '**/src/setupTests.*' },
            ],
            // otherwise.
            include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
          },
          logger: {
            infrastructure: 'silent',
          },
          typescript: {
            configOverwrite: {
              compilerOptions: {
                declarationMap: false,
                incremental: true,
                inlineSourceMap: false,
                noEmit: true,
                skipLibCheck: true,
                sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                tsBuildInfoFile: paths.appTsBuildInfoFile,
              },
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: 'write-references',
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.appNodeModules,
            }),
            // profile: true,
          },
        }),
      !disableESLintPlugin &&
        new ESLintPlugin({
          baseConfig: {
            extends: [require.resolve('eslint-config-react-app/base')],
            rules: {
              ...(!hasJsxRuntime && {
                'react/react-in-jsx-scope': 'error',
              }),
            },
          },
          cache: true,
          cacheLocation: path.resolve(paths.appNodeModules, '.cache/.eslintcache'),
          context: paths.appSrc,
          // ESLint class options
          cwd: paths.appPath,
          eslintPath: require.resolve('eslint'),
          // Plugin options
          extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
          failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
          formatter: require.resolve('react-dev-utils/eslintFormatter'),
          resolvePluginsRelativeTo: __dirname,
        }),
    ].filter(Boolean),
    resolve: {
      // This allows you to set a fallback for where webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        ...(modules.webpackAliases || {}),
      },
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions.map(ext => `.${ext}`).filter(ext => useTypeScript || !ext.includes('ts')),
      // https://github.com/facebook/create-react-app/issues/253
      modules: ['node_modules', paths.appNodeModules].concat(modules.additionalModulePaths || []),
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(paths.appSrc, [
          paths.appPackageJson,
          reactRefreshRuntimeEntry,
          reactRefreshWebpackPluginRuntimeEntry,
          babelRuntimeEntry,
          babelRuntimeEntryHelpers,
          babelRuntimeRegenerator,
        ]),
      ],
    },
    // Webpack noise constrained to errors and warnings
    stats: 'errors-warnings',
    // Turn off performance processing because we utilize
    target: ['browserslist'],
  };
};
