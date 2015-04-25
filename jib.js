
var CONF_PATH = __dirname + '/conf';
var PLUGINS_PATH = __dirname + '/plugins';


var config = require('./lib/config');
var channels = require('./lib/channels');
var plugins = require('./lib/plugins');

var util = require('util');
var irc = require('irc');



Promise.all([
  config.loadJson(CONF_PATH + '/client.json'),
  plugins.load(PLUGINS_PATH),
]).then(function (results) {
  var config = results[0];
  var plugins = results[1];
  var client;

  channels.loadConfig(CONF_PATH).then(function (channels) {

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
  console.error("Error initializing application", err.stack);
});




/*

client.addListener('message' + CHANNEL, function (from, message) {
  util.log('MSG: ' + from + ' => ' + CHANNEL + ': ' + message);

  if (cannedMessages[message]) {
    client.say(CHANNEL, from + ', ' + cannedMessages[message]);
  } else if (message.startsWith('!help')) {
    client.notice(from, 'Who do you think I am, your mother?');
  }

});

*/