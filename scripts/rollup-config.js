/**
 *
 * @description: rollup 配置文件
 * @param {*}
 */
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import path from 'path';

fs.rmSync(path.join(process.cwd(), 'dist'), { force: true, recursive: true });
/**
 *
 * @returns {Array}
 * @description: 创建 rollup 配置
 * @param {*}
 * @example: createConfig()
 */
const createConfig = () => {
  const baseConfig = {
    external: [/@babel\/runtime/].filter(Boolean),
    input: 'src/index.ts',
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'runtime',
        plugins: ['@babel/plugin-transform-runtime'],
        presets: [
          [
            '@babel/preset-env',
            {
              modules: false,
            },
          ],
        ],
      }),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  };
  if (process.env.NODE_ENV === 'production') {
    return [
      {
        ...baseConfig,
        output: [
          {
            file: 'dist/index.esm.js',
            format: 'es',
            sourcemap: true,
          },
        ],
      },
      {
        ...baseConfig,
        output: [
          {
            exports: 'named',
            file: 'dist/index.min.js',
            format: 'cjs',
            sourcemap: true,
          },
          {
            exports: 'named',
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'bkIframe',
            sourcemap: true,
          },
        ],
        plugins: baseConfig.plugins.concat([
          terser({
            maxWorkers: 4,
          }),
        ]),
      },
      {
        external: [/@babel\/runtime/].filter(Boolean),
        input: 'src/base-app/collect-source.ts',
        output: [
          {
            file: 'dist/collect-source.js',
            format: 'es',
            sourcemap: true,
          },
        ],
        plugins: [
          resolve(),
          babel({
            babelHelpers: 'runtime',
            plugins: ['@babel/plugin-transform-runtime'],
            presets: [
              [
                '@babel/preset-env',
                {
                  modules: false,
                },
              ],
            ],
          }),
          typescript({
            tsconfig: './tsconfig.json',
          }),
        ],
      },
    ];
  }
  return [
    {
      ...baseConfig,
      output: [
        {
          file: 'dist/index.esm.js',
          format: 'es',
          sourcemap: true,
        },
      ],
    },
  ];
};
export default createConfig();
