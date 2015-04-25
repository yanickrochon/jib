
var channels = require('../lib/channels');


// Register config to load from each channels
channels.registerConfigKey('operators');


module.exports = operators;


/**
Operator plugin

Auto-OP the users configured in each channels

@param client    the IRC client interface
@param channels  operators config for each channels
*/
function operators(client, channels) {

  Object.keys(channels).forEach(function (channelName) {
    var ops = channels[channelName] || [];

    if (Array.isArray(ops)) {
      bindEvents(client, channelName, ops);
    } else {
      util.log('\u001b[01;31mERR: Operators config is not an array for channel ' + channelName + '; ' + util.inspect(ops) + '\u001b[0m');
    }
  });

}



/**
Bind all events for the specified channel

@param client       the IRC client interface
@param channelName  the channel name to bind to
@param ops          an array of user operators
*/
function bindEvents(client, channelName, ops) {

  client.addListener('join' + channelName, function (from) {
    if (ops.indexOf(from) >= 0) {
      client.send('MODE', channelName, '+o', from);
    }
  });

  // TODO : event on nick change, too

}