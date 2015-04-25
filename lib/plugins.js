
const PLUGIN_NAME_SUFFIX = '.js';
const PLUGIN_NAME_SUFFIX_PATTERN = /\.[^.]*$/;

var fs = require('fs');
var path = require('path');


module.exports.load = loadPlugins;
module.exports.getNames = getPluginsNames;




function loadPlugins(pluginsPath) {

  return getPluginsNames(pluginsPath).then(function (pluginNames) {
    var plugins = {};

    pluginNames.forEach(function (pluginName) {
      plugins[pluginName] = require(path.join(pluginsPath, pluginName + PLUGIN_NAME_SUFFIX));
    });

    return plugins;
  });

}



function getPluginsNames(pluginsPath) {
  return new Promise(function (resolve, reject) {
    fs.readdir(pluginsPath, function (err, files) {
      if (err) {

        reject(err);

      } else {
        filterFiles(files.map(function (file) {
          return path.join(pluginsPath, file);
        })).then(function (files) {

          resolve(files.map(function (file) {
            return path.basename(file).replace(PLUGIN_NAME_SUFFIX_PATTERN, '');
          }));

        }).catch(function (err) {
          if (err) {
            util.log('\u001b[01;31mERR: ' + util.inspect(err.stack) + '\u001b[0m');
          }

          resolve([]);

        })
      }
    })

  });
}


function filterFiles(files) {
  return new Promise(function (resolve, reject) {
    var counter = 0;
    var fileList = [];

    if (!files.length) {
      resolve([]);
    } else {
      files.forEach(function (file) {
        fs.stat(file, function (err, stat) {
          if (err) {
            util.log('\u001b[01;31mERR: ' + util.inspect(err.stack) + '\u001b[0m');

            ++counter;

          } else if (stat.isFile()) {
            fs.access(file, fs.R_OK, function (err) {

              if (err) {
                util.log('\u001b[01;31mERR: Cannot read plugin module ' + file + '\u001b[0m');
              } else {
                fileList.push(file);
              }

              ++counter;

              if (files.length === counter) {
                resolve(fileList);
              }
            });
          }

        })
      });
    }
  });
}