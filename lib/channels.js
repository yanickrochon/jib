
const CHANNEL_IDENTIFIER = '#';

const CONF_SUFFIX = '.json';


var util = require('util');
var fs = require('fs');
var path = require('path');
var config = require('./config');

var conf_keys = [];


module.exports.registerConfigKey = registerConfigKey;

module.exports.loadConfig = loadChannelsConfig;
module.exports.getNames = getChannelNames;



function registerConfigKey(key) {
  if (conf_keys.indexOf(key) === -1) {
    conf_keys.push(key);
  }
}



function loadChannelsConfig() {

  return getChannelNames().then(function (channels) {

    return Promise.all(channels.map(function (channelName) {
      return Promise.all(conf_keys.map(function (key) {
        return config.loadJson(path.join(channelName, key + CONF_SUFFIX));
      })).then(function (config) {
        var channelConfig = {};

        conf_keys.forEach(function (key, index) {
          if (config[index] !== null && config[index] !== undefined) {
            channelConfig[key] = config[index];
          }
        })

        return channelConfig;
      });
    })).then(function (config) {
      var channelsConfig = {};

      channels.forEach(function (channelName, index) {
        if (config[index] !== null && config[index] !== undefined) {
          channelsConfig[channelName] = config[index];
        }
      });

      return channelsConfig;
    });
  });

}



function getChannelNames() {
  return new Promise(function (resolve, reject) {
    var configPath = config.getBasePath();

    fs.readdir(configPath, function (err, files) {
      if (err) {

        reject(err);

      } else {
        filterDirectories(files.map(function (file) {
          return path.join(configPath, file);
        })).then(function (dirs) {

          resolve(dirs.map(function (dir) {
            return path.basename(dir);
          }).filter(function (dir) {
            return dir.startsWith(CHANNEL_IDENTIFIER);
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


function filterDirectories(files) {
  return new Promise(function (resolve, reject) {
    var counter = 0;
    var dirs = [];

    if (!files.length) {
      resolve([]);
    } else {
      files.forEach(function (file) {
        fs.stat(file, function (err, stat) {
          if (err) {
            util.log('\u001b[01;31mERR: ' + util.inspect(err.stack) + '\u001b[0m');
          } else if (stat.isDirectory()) {
            dirs.push(file);
          }

          ++counter;

          if (files.length === counter) {
            resolve(dirs);
          }
        })
      });
    }
  });
}