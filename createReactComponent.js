// link https://raw.githubusercontent.com/wuweiweiwu/create-react-component/master/create-react-component-core.zip

'use strict';

const validateProjectName = require('validate-npm-package-name');
const chalk = require('chalk');
const commander = require('commander');
const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;
const spawn = require('cross-spawn');
const semver = require('semver');
const dns = require('dns');
const tmp = require('tmp');
const unpack = require('tar-pack').unpack;
const url = require('url');
const hyperquest = require('hyperquest');
const envinfo = require('envinfo');
const os = require('os');

const packageJson = require('./package.json');

// These files should be allowed to remain on a failed install,
// but then silently removed during the next create.
const errorLogFilePatterns = [
  'npm-debug.log',
  'yarn-error.log',
  'yarn-debug.log',
];

const devDependencies = [
  '@storybook/addon-actions',
  '@storybook/addon-notes',
  '@storybook/addon-options',
  '@storybook/addon-storyshots',
  '@storybook/react',
  'autoprefixer',
  'babel-cli',
  'babel-core',
  'babel-eslint',
  'babel-jest',
  'babel-loader',
  'babel-plugin-transform-object-rest-spread',
  'babel-polyfill',
  'babel-preset-env',
  'babel-preset-react',
  'babel-preset-react-app',
  'cross-env',
  'css-loader',
  'enzyme',
  'enzyme-adapter-react-16',
  'eslint',
  'eslint-config-airbnb',
  'eslint-config-prettier',
  'eslint-config-react-app',
  'eslint-loader',
  'eslint-plugin-flowtype',
  'eslint-plugin-import',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-react',
  'file-loader',
  'gh-pages',
  'html-webpack-plugin',
  'identity-obj-proxy',
  'jest',
  'jest-enzyme',
  'json-loader',
  'node-sass',
  'postcss-loader',
  'prettier',
  'react-addons-shallow-compare',
  'react-hot-loader',
  'react-test-renderer',
  'rimraf',
  'sass-loader',
  'style-loader',
  'webpack',
  'webpack-dev-server',
  'webpack-node-externals',
];

const peerDependencies = ['react', 'react-dom'];

let projectName;
