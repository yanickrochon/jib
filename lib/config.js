
const CONF_SUFFIX = '.json';

var util = require('util');
var fs = require('fs');
var path = require('path');

var basePath = path.resolve('.');


module.exports.getBasePath = getConfBasePath;
module.exports.setBasePath = setConfBasePath;

module.exports.loadJson = loadJsonConfig;
module.exports.saveJson = saveJsonConfig;


/**
Return the base path to load/save config
@return string
*/
function getConfBasePath() {
  return basePath;
}


/**
Set the base path for any relative path to load/save config
@param confBasePath
*/
function setConfBasePath(confBasePath) {
  basePath = path.resolve(confBasePath);
}


/**
Return an absolute path to target
@param target
@return string
*/
function toAbsolutePath(target) {
  return (path.isAbsolute(target) ? target : path.resolve(path.join(basePath, target))) + CONF_SUFFIX;
}


/**
Load the given target and return the data as JSON.
If the config cannot be loaded, or the data cannot be read,
the promise is rejected.
@param target  a path to read the data from
@return Promise
*/
function loadJsonConfig(target) {
  return new Promise(function (resolve, reject) {
    fs.readFile(toAbsolutePath(target), function(err, data) {
      if (err) {
        resolve(undefined);
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      }
    });
  });
}

/**
Save the given object to target as JSON.
If the object cannot saved, the promise is rejected
@param target  the path to save the data to
@param obj     the object to save
@return Promise
*/
function saveJsonConfig(target, obj) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(toAbsolutePath(target), JSON.stringify(obj, null, 2), function (err){
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

