var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;
var util = require('util');

var PKG_DIR = process.cwd();
var SRC_DIR = path.join(PKG_DIR, 'src');
var TEST_DIR = path.join(PKG_DIR, 'tst');
var BUILD_DIR = path.join(PKG_DIR, 'build');
var SRC_BUILD_DIR = path.join(BUILD_DIR, 'src');
var TEST_BUILD_DIR = path.join(BUILD_DIR, 'tst');
var APP_NAME = 'guessingGame';

function mkpath(fullPath) {
  var builtPath = ['/'];
  fullPath.split(path.sep).forEach(function (dir) {
    try {
      builtPath.push(dir);
      var thisPath = path.join.apply(null, builtPath);
      fs.mkdirSync(thisPath, 0755);
      console.log('Created directory %s', thisPath);
    } catch (e) {
      // Swallow "file already exists" errors.
      if (e.code != 'EISDIR' && e.code != 'EEXIST') {
        throw e;
      }
    }
  });
}

function execute(command, opts) {
  var options;
  if (typeof opts == 'string') {
    options = { cwd: opts };
  } else {
    options = opts;
  }

  console.log('Executing `%s` in %s', command, options.cwd);
  try {
    var output = execSync(command, options);
    process.stdout.write(output);
  } catch (e) {
    process.stdout.write(e.stdout);
    process.stderr.write(e.stderr);
    process.exit(1);
  }
}

function npmInstall(packages, workingDirectory) {
  if (typeof packages == 'string') {
    packages = [ packages ];
  }
  packages.forEach(function (packageName) {
    execute(util.format('npm install %s', packageName), workingDirectory);
  });
}

function env() {
  mkpath(path.join(BUILD_DIR, 'bin'));
  mkpath(path.join(BUILD_DIR, 'lib'));
  mkpath(path.join(BUILD_DIR, 'share', 'man'));
  mkpath(path.join(BUILD_DIR, 'usr', 'local'));
}

function buildTest() {
  env();
  mkpath(TEST_BUILD_DIR);
  npmInstall([ 'nodeunit', SRC_DIR, TEST_DIR ], TEST_BUILD_DIR);

  var makeEnv = process.env;
  makeEnv['PREFIX'] = BUILD_DIR;
  execute('make', {
    cwd: path.join(TEST_BUILD_DIR, 'node_modules', 'nodeunit'),
    env: { PREFIX: BUILD_DIR }
  });
  execute('make install', {
    cwd: path.join(TEST_BUILD_DIR, 'node_modules', 'nodeunit'),
    env: makeEnv
  });
}

function test() {
  buildTest();
  var testFile = path.join('node_modules', 'com.aerieworks.guessingGame.test', 'index.js');
  execute(util.format('nodeunit %s', testFile), TEST_BUILD_DIR);
}

function lambda() {
  mkpath(BUILD_DIR);
  execute(util.format('zip -r %s.zip %s', APP_NAME, SRC_DIR), BUILD_DIR);
}

module.exports = {
  defaultTarget: 'lambda',
  targets: {
    env: env,
    buildTest: buildTest,
    test: test,
    lambda: lambda
  }
};
