
var fs = require('fs');


module.exports.loadJson = loadJsonConfig;
module.exports.saveJson = saveJsonConfig;


/**
Load the given target and return the data as JSON.
If the config cannot be loaded, or the data cannot be read,
the promise is rejected.
@param target  a path to read the data from
@return Promise
*/
function loadJsonConfig(target) {
  return new Promise(function (resolve, reject) {
    fs.readFile(target, function(err, data) {
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
    fs.writeFile(target, JSON.stringify(obj, null, 2), function (err){
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

