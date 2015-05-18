
var CONF_PATH = 'conf';
var PLUGINS_PATH = 'plugins';


var config = require('./lib/config');
var channels = require('./lib/channels');
var plugins = require('./lib/plugins');

var util = require('util');
var irc = require('irc');


config.setBasePath(CONF_PATH);
plugins.setBasePath(PLUGINS_PATH);


Promise.all([
  config.loadJson('client'),
  plugins.load(),
]).then(function (results) {
  var config = results[0];
  var plugins = results[1];
  var client;

  channels.loadConfig().then(function (channels) {

    // set channels to join
    config.options.channels = Object.keys(channels);

    client = new irc.Client(config.network, config.name, config.options);

    client.addListener('error', function(message) {
      util.log('\u001b[01;31mHANDLED ERROR: ' + util.inspect(message) + '\u001b[0m');
    });

    Object.keys(plugins).forEach(function (pluginName) {
      var channelsConfig = {};

      // do not expose configurations outside the plugin's defined one
      Object.keys(channels).forEach(function (channelName) {
        channelsConfig[channelName] = channels[channelName][pluginName];
      });

      plugins[pluginName](client, channelsConfig);
    });

  });

}).catch(function (err) {
  util.log('\u001b[01;31mError initializing application: ' + util.inspect(err) + '\u001b[0m');
});
