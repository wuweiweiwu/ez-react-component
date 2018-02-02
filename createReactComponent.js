// link https://raw.githubusercontent.com/wuweiweiwu/create-react-component/master/core.zip

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
const request = require('request');

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
  'react',
  'react-dom',
];

// const peerDependencies = ['react', 'react-dom'];

const dependencies = ['prop-types'];

const jest = {
  setupTestFrameworkScriptFile: './node_modules/jest-enzyme/lib/index.js',
  setupFiles: ['./test-config/shim.js', './test-config/test-setup.js'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|scss|less)$': 'identity-obj-proxy',
  },
};

const scripts = {
  build:
    'npm run clean && cross-env NODE_ENV=production TARGET=umd webpack --bail',
  'build:demo':
    'npm run clean:demo && cross-env NODE_ENV=production TARGET=demo webpack --bail && npm run build-storybook',
  clean: 'rimraf dist',
  'clean:demo': 'rimraf build',
  start:
    'cross-env NODE_ENV=development TARGET=development webpack-dev-server --inline --hot',
  lint: 'eslint src examples',
  prettier:
    'prettier --single-quote --trailing-comma es5 --write "{src,examples}/**/*.{js,scss}"',
  prepublishOnly: 'npm run lint && npm run test && npm run build',
  test: 'jest',
  'test:watch': 'jest --watchAll',
  'test:coverage':
    'jest --coverage && ./cc-test-reporter after-build --id="YOUR_REPORTER_ID_HERE"',
  deploy: 'npm run build:demo && gh-pages -d build',
  storybook:
    'cross-env TARGET=development start-storybook -p ${PORT:-3001} -h 0.0.0.0',
  'build-storybook':
    'cross-env NODE_ENV=production TARGET=demo build-storybook -o build/storybook',
};

const coreUrl =
  'https://raw.githubusercontent.com/wuweiweiwu/create-react-component/master/core.zip';

let projectName;

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    projectName = name;
  })
  .option('--verbose', 'print additional logs')
  .option('--info', 'print environment debug info')
  .option(
    '--scripts-version <alternative-package>',
    'use a non-standard version of react-scripts'
  )
  .option('--use-npm')
  .allowUnknownOption()
  .on('--help', () => {
    console.log(`    Only ${chalk.green('<project-directory>')} is required.`);
    console.log();
    console.log(
      `    A custom ${chalk.cyan('--scripts-version')} can be one of:`
    );
    console.log(`      - a specific npm version: ${chalk.green('0.8.2')}`);
    console.log(
      `      - a custom fork published on npm: ${chalk.green(
        'my-react-scripts'
      )}`
    );
    console.log(
      `      - a .tgz archive: ${chalk.green(
        'https://mysite.com/my-react-scripts-0.8.2.tgz'
      )}`
    );
    console.log(
      `      - a .tar.gz archive: ${chalk.green(
        'https://mysite.com/my-react-scripts-0.8.2.tar.gz'
      )}`
    );
    console.log(
      `    It is not needed unless you specifically want to use a fork.`
    );
    console.log();
    console.log(
      `    If you have any problems, do not hesitate to file an issue:`
    );
    console.log(
      `      ${chalk.cyan(
        'https://github.com/facebook/create-react-app/issues/new'
      )}`
    );
    console.log();
  })
  .parse(process.argv);

if (typeof projectName === 'undefined') {
  if (program.info) {
    envinfo.print({
      // packages: ['react', 'react-dom', 'react-scripts'],
      packages: dependencies,
      noNativeIDE: true,
      duplicates: true,
    });
    process.exit(0);
  }
  console.error('Please specify the project directory:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`
  );
  console.log();
  console.log('For example:');
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green('my-react-component')}`
  );
  console.log();
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  );
  process.exit(1);
}

function printValidationResults(results) {
  if (typeof results !== 'undefined') {
    results.forEach(error => {
      console.error(chalk.red(`  *  ${error}`));
    });
  }
}

const hiddenProgram = new commander.Command()
  .option(
    '--internal-testing-template <path-to-template>',
    '(internal usage only, DO NOT RELY ON THIS) ' +
      'use a non-standard application template'
  )
  .parse(process.argv);

createApp(
  projectName,
  program.verbose,
  program.scriptsVersion,
  program.useNpm,
  hiddenProgram.internalTestingTemplate
);

function createApp(name, verbose, version, useNpm, template) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkAppName(appName);
  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }

  console.log(
    `Creating a new React component environment in ${chalk.green(root)}.`
  );
  console.log();

  // unzip stuff here
  const unzip = require('unzip-stream');
  // const mv = require('mv');
  console.log('Unzipping core files');
  request(coreUrl)
    .pipe(unzip.Extract({ path: root }))
    .on('close', function() {
      // console.log('Moving core files');
      // const dirs = [
      //   '.npmignore',
      //   '.babelrc',
      //   '__mocks__',
      //   '.eslintrc',
      //   'webpack.config.js',
      //   '.storybook',
      //   '.gitignore',
      //   'examples',
      //   '.prettierrc',
      //   'test-config',
      //   'travis.yml',
      //   'codeclimate.yml',
      //   'src',
      // ];
      // dirs.forEach(dir =>
      //   mv(
      //     root + '/create-react-component-core/' + dir,
      //     root + '/' + dir,
      //     {
      //       mkdirp: true,
      //     },
      //     () => {}
      //   )
      // );

      const packageJson = {
        name: appName,
        version: '0.0.1',
        private: true,
        main: 'dist/main.js',
        files: ['dist'],
        scripts,
        jest,
        peerDependencies: {
          react: '^15.3.0 || ^16.0.0',
          'react-dom': '^15.3.0 || ^16.0.0',
        },
      };
      fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson, null, 2) + os.EOL
      );

      const useYarn = useNpm ? false : shouldUseYarn();
      const originalDirectory = process.cwd();
      process.chdir(root);
      if (!useYarn && !checkThatNpmCanReadCwd()) {
        process.exit(1);
      }

      if (!semver.satisfies(process.version, '>=6.0.0')) {
        console.log(
          chalk.yellow(
            `You are using Node ${
              process.version
            } so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to Node 6 or higher for a better, fully supported experience.\n`
          )
        );
        // Fall back to latest supported react-scripts on Node 4
        version = 'react-scripts@0.9.x';
      }

      if (!useYarn) {
        const npmInfo = checkNpmVersion();
        if (!npmInfo.hasMinNpm) {
          if (npmInfo.npmVersion) {
            console.log(
              chalk.yellow(
                `You are using npm ${
                  npmInfo.npmVersion
                } so the project will be boostrapped with an old unsupported version of tools.\n\n` +
                  `Please update to npm 3 or higher for a better, fully supported experience.\n`
              )
            );
          }
          // Fall back to latest supported react-scripts for npm 3
          version = 'react-scripts@0.9.x';
        }
      }
      run(
        root,
        appName,
        version,
        verbose,
        originalDirectory,
        template,
        useYarn
      );
    });
}

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function install(
  root,
  useYarn,
  dependencies,
  devDependencies,
  verbose,
  isOnline
) {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    let args_dev;
    // let args_peer;
    if (useYarn) {
      command = 'yarnpkg';
      args = ['add'];
      args_dev = ['add', '--dev'];
      // args_peer = ['add', '--peer'];
      if (!isOnline) {
        args.push('--offline');
        args_dev.push('--offline');
        // args_peer.push('--offline');
      }
      [].push.apply(args, dependencies);
      [].push.apply(args_dev, devDependencies);
      // [].push.apply(args_peer, peerDependencies);

      // Explicitly set cwd() to work around issues like
      // https://github.com/facebook/create-react-app/issues/3326.
      // Unfortunately we can only do this for Yarn because npm support for
      // equivalent --prefix flag doesn't help with this issue.
      // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
      args.push('--cwd');
      args.push(root);
      args_dev.push('--cwd');
      args_dev.push(root);
      // args_peer.push('--cwd');
      // args_peer.push(root);

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        console.log(chalk.yellow('Falling back to the local Yarn cache.'));
        console.log();
      }
      // npm version
    } else {
      command = 'npm';
      args = ['install', '--save', '--loglevel', 'error'].concat(dependencies);
      // args_peer = ['install', '--save', '--loglevel', 'error'].concat(
      //   peerDependencies
      // );
      args_dev = ['install', '--save-dev', '--loglevel', 'error'].concat(
        devDependencies
      );
    }

    if (verbose) {
      args.push('--verbose');
    }

    // this is pretty disgusting lol
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      const child2 = spawn(command, args_dev, { stdio: 'inherit' });
      child2.on('close', code2 => {
        if (code2 !== 0) {
          reject({
            command: `${command} ${args_dev.join(' ')}`,
          });
          return;
        }
        resolve();
      });
    });
  });
}

function run(
  root,
  appName,
  version,
  verbose,
  originalDirectory,
  template,
  useYarn
) {
  // const packageToInstall = getInstallPackage(version, originalDirectory);
  // const allDependencies = ['react', 'react-dom', packageToInstall];
  // const allDependencies = [
  //   ...dependencies,
  //   ...devDependencies,
  //   ...peerDependencies,
  // ];

  console.log('Installing packages. This might take a couple of minutes.');
  // allDependencies.forEach(dep => {
  // getPackageName(packageToInstall)
  // getPackageName(dep)
  //   .then(packageName =>
  //     checkIfOnline(useYarn).then(isOnline => ({
  //       isOnline: isOnline,
  //       packageName: packageName,
  //     }))
  //   )
  //   .then(info => {
  //     const isOnline = info.isOnline;
  //     const packageName = info.packageName;
  //     console.log(
  //       `Installing ${chalk.cyan('react')}, ${chalk.cyan(
  //         'react-dom'
  //       )}, and ${chalk.cyan(packageName)}...`
  //     );
  //     console.log(`Installing ${chalk.cyan(packageName)}...`);
  //
  //     return install(root, useYarn, allDependencies, verbose, isOnline).then(
  //       () => packageName
  //     );
  //   })
  checkIfOnline(useYarn)
    .then(isOnline => ({
      isOnline,
    }))
    .then(info => {
      const isOnline = info.isOnline;
      console.log(
        `Installing all the freaking dependencies like ${chalk.cyan(
          'prop-types'
        )}, ${chalk.cyan('react')} and ${chalk.cyan('babel-core')} ...`
      );
      return install(
        root,
        useYarn,
        dependencies,
        devDependencies,
        verbose,
        isOnline
      );
    })
    // .then(() => {
    //   unpackCore();
    // })
    .catch(reason => {
      console.log();
      console.log('Aborting installation.');
      if (reason.command) {
        console.log(`  ${chalk.cyan(reason.command)} has failed.`);
      } else {
        console.log(chalk.red('Unexpected error. Please report it as a bug:'));
        console.log(reason);
      }
      console.log();

      // On 'exit' we will delete these files from target directory.
      const knownGeneratedFiles = ['package.json', 'node_modules'];
      const currentFiles = fs.readdirSync(path.join(root));
      currentFiles.forEach(file => {
        knownGeneratedFiles.forEach(fileToMatch => {
          // This remove all of knownGeneratedFiles.
          if (file === fileToMatch) {
            console.log(`Deleting generated file... ${chalk.cyan(file)}`);
            fs.removeSync(path.join(root, file));
          }
        });
      });
      const remainingFiles = fs.readdirSync(path.join(root));
      if (!remainingFiles.length) {
        // Delete target folder if empty
        console.log(
          `Deleting ${chalk.cyan(`${appName}/`)} from ${chalk.cyan(
            path.resolve(root, '..')
          )}`
        );
        process.chdir(path.resolve(root, '..'));
        fs.removeSync(path.join(root));
      }
      console.log('Done.');
      process.exit(1);
    });
  // });
}

// function getInstallPackage(version, originalDirectory) {
//   let packageToInstall = 'react-scripts';
//   const validSemver = semver.valid(version);
//   if (validSemver) {
//     packageToInstall += `@${validSemver}`;
//   } else if (version && version.match(/^file:/)) {
//     packageToInstall = `file:${path.resolve(
//       originalDirectory,
//       version.match(/^file:(.*)?$/)[1]
//     )}`;
//   } else if (version) {
//     // for tar.gz or alternative paths
//     packageToInstall = version;
//   }
//   return packageToInstall;
// }

function getTemporaryDirectory() {
  return new Promise((resolve, reject) => {
    // Unsafe cleanup lets us recursively delete the directory if it contains
    // contents; by default it only allows removal if it's empty
    tmp.dir({ unsafeCleanup: true }, (err, tmpdir, callback) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          tmpdir: tmpdir,
          cleanup: () => {
            try {
              callback();
            } catch (ignored) {
              // Callback might throw and fail, since it's a temp directory the
              // OS will clean it up eventually...
            }
          },
        });
      }
    });
  });
}

function extractStream(stream, dest) {
  return new Promise((resolve, reject) => {
    stream.pipe(
      unpack(dest, err => {
        if (err) {
          reject(err);
        } else {
          resolve(dest);
        }
      })
    );
  });
}

// Extract package name from tarball url or path.
// function getPackageName(installPackage) {
//   if (installPackage.match(/^.+\.(tgz|tar\.gz)$/)) {
//     return getTemporaryDirectory()
//       .then(obj => {
//         let stream;
//         if (/^http/.test(installPackage)) {
//           stream = hyperquest(installPackage);
//         } else {
//           stream = fs.createReadStream(installPackage);
//         }
//         return extractStream(stream, obj.tmpdir).then(() => obj);
//       })
//       .then(obj => {
//         const packageName = require(path.join(obj.tmpdir, 'package.json')).name;
//         obj.cleanup();
//         return packageName;
//       })
//       .catch(err => {
//         // The package name could be with or without semver version, e.g. react-scripts-0.2.0-alpha.1.tgz
//         // However, this function returns package name only without semver version.
//         console.log(
//           `Could not extract the package name from the archive: ${err.message}`
//         );
//         const assumedProjectName = installPackage.match(
//           /^.+\/(.+?)(?:-\d+.+)?\.(tgz|tar\.gz)$/
//         )[1];
//         console.log(
//           `Based on the filename, assuming it is "${chalk.cyan(
//             assumedProjectName
//           )}"`
//         );
//         return Promise.resolve(assumedProjectName);
//       });
//   } else if (installPackage.indexOf('git+') === 0) {
//     // Pull package name out of git urls e.g:
//     // git+https://github.com/mycompany/react-scripts.git
//     // git+ssh://github.com/mycompany/react-scripts.git#v1.2.3
//     return Promise.resolve(installPackage.match(/([^/]+)\.git(#.*)?$/)[1]);
//   } else if (installPackage.match(/.+@/)) {
//     // Do not match @scope/ when stripping off @version or @tag
//     return Promise.resolve(
//       installPackage.charAt(0) + installPackage.substr(1).split('@')[0]
//     );
//   } else if (installPackage.match(/^file:/)) {
//     const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
//     const installPackageJson = require(path.join(
//       installPackagePath,
//       'package.json'
//     ));
//     return Promise.resolve(installPackageJson.name);
//   }
//   return Promise.resolve(installPackage);
// }

function checkNpmVersion() {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync('npm --version')
      .toString()
      .trim();
    hasMinNpm = semver.gte(npmVersion, '3.0.0');
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  };
}

// function checkNodeVersion(packageName) {
//   const packageJsonPath = path.resolve(
//     process.cwd(),
//     'node_modules',
//     packageName,
//     'package.json'
//   );
//   const packageJson = require(packageJsonPath);
//   if (!packageJson.engines || !packageJson.engines.node) {
//     return;
//   }
//
//   if (!semver.satisfies(process.version, packageJson.engines.node)) {
//     console.error(
//       chalk.red(
//         'You are running Node %s.\n' +
//           'Create React App requires Node %s or higher. \n' +
//           'Please update your version of Node.'
//       ),
//       process.version,
//       packageJson.engines.node
//     );
//     process.exit(1);
//   }
// }

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const deps = [...dependencies, ...devDependencies].sort();
  if (deps.indexOf(appName) >= 0) {
    console.error(
      chalk.red(
        `We cannot create a project called ${chalk.green(
          appName
        )} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(deps.map(depName => `  ${depName}`).join('\n')) +
        chalk.red('\n\nPlease choose a different project name.')
    );
    process.exit(1);
  }
}

function makeCaretRange(dependencies, name) {
  const version = dependencies[name];

  if (typeof version === 'undefined') {
    console.error(chalk.red(`Missing ${name} dependency in package.json`));
    process.exit(1);
  }

  let patchedVersion = `^${version}`;

  if (!semver.validRange(patchedVersion)) {
    console.error(
      `Unable to patch ${name} dependency version because version ${chalk.red(
        version
      )} will become invalid ${chalk.red(patchedVersion)}`
    );
    patchedVersion = version;
  }

  dependencies[name] = patchedVersion;
}
//
// function setCaretRangeForRuntimeDeps(packageName) {
//   const packagePath = path.join(process.cwd(), 'package.json');
//   const packageJson = require(packagePath);
//
//   if (typeof packageJson.dependencies === 'undefined') {
//     console.error(chalk.red('Missing dependencies in package.json'));
//     process.exit(1);
//   }
//
//   const packageVersion = packageJson.dependencies[packageName];
//   if (typeof packageVersion === 'undefined') {
//     console.error(chalk.red(`Unable to find ${packageName} in package.json`));
//     process.exit(1);
//   }
//
//   makeCaretRange(packageJson.dependencies, 'react');
//   makeCaretRange(packageJson.dependencies, 'react-dom');
//
//   fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + os.EOL);
// }

// If project only contains files generated by GH, it’s safe.
// Also, if project contains remnant error logs from a previous
// installation, lets remove them now.
// We also special case IJ-based products .idea because it integrates with CRA:
// https://github.com/facebook/create-react-app/pull/368#issuecomment-243446094
function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    '.DS_Store',
    'Thumbs.db',
    '.git',
    '.gitignore',
    '.idea',
    'README.md',
    'LICENSE',
    'web.iml',
    '.hg',
    '.hgignore',
    '.hgcheck',
    '.npmignore',
    'mkdocs.yml',
    'docs',
    '.travis.yml',
    '.gitlab-ci.yml',
    '.gitattributes',
  ];
  console.log();

  const conflicts = fs
    .readdirSync(root)
    .filter(file => !validFiles.includes(file))
    // Don't treat log files from previous installation as conflicts
    .filter(
      file => !errorLogFilePatterns.some(pattern => file.indexOf(pattern) === 0)
    );

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      console.log(`  ${file}`);
    }
    console.log();
    console.log(
      'Either try using a new directory name, or remove the files listed above.'
    );

    return false;
  }

  // Remove any remnant files from a previous installation
  const currentFiles = fs.readdirSync(path.join(root));
  currentFiles.forEach(file => {
    errorLogFilePatterns.forEach(errorLogFilePattern => {
      // This will catch `(npm-debug|yarn-error|yarn-debug).log*` files
      if (file.indexOf(errorLogFilePattern) === 0) {
        fs.removeSync(path.join(root, file));
      }
    });
  });
  return true;
}

function getProxy() {
  if (process.env.https_proxy) {
    return process.env.https_proxy;
  } else {
    try {
      // Trying to read https-proxy from .npmrc
      let httpsProxy = execSync('npm config get https-proxy')
        .toString()
        .trim();
      return httpsProxy !== 'null' ? httpsProxy : undefined;
    } catch (e) {
      return;
    }
  }
}
function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('');
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== 'string') {
    return true;
  }
  const lines = childOutput.split('\n');
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = '; cwd = ';
  const line = lines.find(line => line.indexOf(prefix) === 0);
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  );
  if (process.platform === 'win32') {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    );
  }
  return false;
}

function checkIfOnline(useYarn) {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null);
        });
      } else {
        resolve(err == null);
      }
    });
  });
}

// unpackCore();

function unpackCore() {
  request(coreUrl).pipe(
    unpack(process.cwd(), function(err) {
      if (err) console.error(err.stack);
      else console.log('done');
    })
  );
}
