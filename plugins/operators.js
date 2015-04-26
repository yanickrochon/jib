
const OP_MODE_PATTERN = /\+[^\-]*o/;

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
function operators(client, channelsOps) {

  client.addListener('join', function (channel, nick, message) {
    channelsOps[channel] && isSelfChanOp(client, channel) && makeOp(client, channel, channelsOps[channel], nick);
  });

  client.addListener('nick', function (oldnick, newnick, channels, message) {
    channels.forEach(function (channel) {
      channelsOps[channel] && isSelfChanOp(client, channel) && makeOp(client, channelsOps[channel], newnick);
    });
  });

}


/**
Make sure that we are a channel operator in the given channel
@param client  the irc client interace
@param channel  the channel we want to check
@return boolean
*/
function isSelfChanOp(client, channel) {
  var chanInfo = client.chans[channel];

  //console.log("*** TEST OP for", channel, chanInfo && chanInfo.mode, chanInfo && OP_MODE_PATTERN.test(chanInfo.mode));

  // TODO : the channel information is not being updated if the bot receives or loses operator privileges...
  //        Just assume that we are OP... whetever for now

  return true; // chanInfo && OP_MODE_PATTERN.test(chanInfo.mode);
}



/**
Attempt to make a channel op if the given nick is a known operator
*/
function makeOp(client, channel, operators, nick) {
  if (Array.isArray(operators)) {
    if (operators.indexOf(nick) >= 0) {
      client.send('MODE', channel, '+o', nick);
    }
  } else {
    util.log('\u001b[01;31mERR: Operators config is not an array for channel ' + channel + '; ' + util.inspect(operators) + '\u001b[0m');
  }
}