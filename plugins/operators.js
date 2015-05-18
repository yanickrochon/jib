
const CONFIG_NAME = 'operators';

const OP_MODE = '@';

const CMD_PATTERN = /^(\w+)(?:\s+(.*))?$/;
const WHITESPACE_PATTERN = /\s+/;

var util = require('util');
var path = require('path');

var config = require('../lib/config');
var channels = require('../lib/channels');
var argsUtil = require('../lib/util/args-util');


// Register config to load from each channels
channels.registerConfigKey(CONFIG_NAME);


module.exports = operators;


/**
Operator plugin

Auto-OP the users configured in each channels

@param client    the IRC client interface
@param channels  operators config for each channels
*/
function operators(client, channelsOps) {

  client.addListener('join', function (channel, nick, message) {
    isSelfChanOp(client, channel) && makeOp(client, channel, channelsOps[channel], nick);
  });

  client.addListener('nick', function (oldnick, newnick, channels, message) {
    channels.forEach(function (channel) {
      isSelfChanOp(client, channel) && makeOp(client, channel, channelsOps[channel], newnick);
    });
  });

  client.addListener('pm', function (from, message) {
    var match = message.match(CMD_PATTERN);

    if (!(Object.keys(channelsOps).some(function (channel) {
      return isChanOp(client, channel, channelsOps[channel], from);
    }))) {
      client.say(from, 'Who the heck are you? Stop bothering me!');
    } else if (!(match && processCmd(client, channelsOps, from, match[1].toLowerCase(), match[2] || ''))) {
      client.say(from, 'What? If you want "help", just ask!');
    }
  });

}


/**
Make sure that we are a channel operator in the given channel
@param client  the irc client interace
@param channel  the channel we want to check
@return boolean
*/
function isSelfChanOp(client, channel) {
  return isChanOp(client, channel, null, client.opt.nick);
}


/**
Check if the given nick is a channel operator, or known channel operator in the
given channel and list of known operators
@param client     the irc client interface
@param channel    the channel we want to check
@param operators  the list of known operators for the given channel
@param nick       the nick to check
@return boolean   true if nick is an known operator
*/
function isChanOp(client, channel, operators, nick) {
  //var chanInfo = client.chans[channel];
  var isOp = false;

  if (operators && Array.isArray(operators)) {
    isOp = operators.indexOf(nick) >= 0;
  }

  if (!isOp && client.chans[channel]) {
    isOp = (client.chans[channel].users[nick] || '').indexOf(OP_MODE) >= 0;
  }

  /*
  console.log("*****USERS NICK=", nick,
    ", CHAN=", channel,
    ", INFO=", client.chans[channel],
    ", USERS=", client.chans[channel].users,
    ", USER=", client.chans[channel].users[nick],
    ", OP=", (client.chans[channel].users[nick] || '').indexOf(OP_MODE),
    ", ISOP=", isOp
  );
  */

  return isOp;
}


/**
Attempt to make a channel op if the given nick is a known operator
@param client     the irc client interface
@param channel    the channel we want to check
@param operators  the list of known operators for the given channel
@param nick       the nick to check
@return boolean   true if nick was set as an operator
*/
function makeOp(client, channel, operators, nick) {
  var result = false;

  if (operators && Array.isArray(operators)) {
    if (operators.indexOf(nick) >= 0) {
      client.send('MODE', channel, '+o', nick);
      result = true;
    }
  } else {
    util.log('\u001b[01;31mERR: Operators config is not an array for channel ' + channel + '; ' + util.inspect(operators) + '\u001b[0m');
  }

  return result;
}


function processCmd(client, channelsOps, from, cmd, args) {
  var valid = false;

  if (cmd === 'help') {
    client.say(from, 'ADDOP <nick> <channel> ...   Register a new operator for the specified channels (separated by space).');
    client.say(from, 'REMOP <nick> [channel] ...   Remove nick from the specified channels (separated by space). If no channels are given, the nick will be removed from all known channels.');
    client.say(from, 'LISTOPS <channel>            List all registered operators in the given channel.')
    valid = true;
  } else if (cmd === 'addop') {
    valid = addOperator(client, channelsOps, from, argsUtil.split(args || '', ['nick']));
  } else if (cmd === 'remop') {
    valid = removeOperator(client, channelsOps, from, argsUtil.split(args || '', ['nick']));
  } else if (cmd === 'listops') {
    valid = listOperators(client, channelsOps, from, argsUtil.split(args || '', ['channel']));
  }

  return valid;
}


function addOperator(client, channelsOps, from, options) {
  var nick = options.nick || '';
  var channels = (options['?'] || '').split(WHITESPACE_PATTERN).filter(function (channel) {
    return channel.length;
  });
  var updatedChannels = [];

  if (!nick.length) {
    client.say(from, "You're missing the nickname!");
  } else if (!channels.length) {
    client.say(from, "You must tell me on which channels to add " + nick + "!");
  } else {
    channels.forEach(function (channel) {
      if (channel in channelsOps) {
        util.log('Adding operator ' + nick + ' to ' + channel + ' by ' + from);
        channelsOps[channel].push(nick);
        updatedChannels.push(channel);

        client.say(nick, 'You have been added OP status in ' + channel + ' by ' + from);

        config.saveJson(path.join(channel, CONFIG_NAME), channelsOps[channel]).then(function () {
          util.log('Channel operators saved for ' + channel);
        }).catch(function (e) {
          util.log('\u001b[01;31mERR: Could not save operator for channel ' + channel + '; ' + util.inspect(channelsOps[channel]) + '\u001b[0m');
        });
      }
    });

    client.say(from, "The user " + nick + " has been added to the operators list successfully (i.e " + updatedChannels.join(', ') + ") and has been notified if currently online");
  }

  return true;
}

function removeOperator(client, channelsOps, from, options) {
  var nick = options.nick || '';
  var channels = (options['?'] || '').split(WHITESPACE_PATTERN).filter(function (channel) {
    return channel.length;
  });
  var updatedChannels = [];

  if (!channels.length) {
    channels = Object.keys(channelsOps);
  }

  if (!nick.length) {
    client.say(from, "You're missing the nickname!");
  } else {
    channels.forEach(function (channel) {
      var nickIndex = channel in channelsOps ? channelsOps[channel].indexOf(nick) : -1;

      if (nickIndex >= 0) {
        util.log('Removing operator ' + nick + ' from ' + channel + ' by ' + from);
        channelsOps[channel].splice(nickIndex, 1);
        updatedChannels.push(channel);

        client.say(nick, 'You have been revoked OP status in ' + channel + ' by ' + from);

        config.saveJson(path.join(channel, CONFIG_NAME), channelsOps[channel]).then(function () {
          util.log('Channel operators saved for ' + channel);
        }).catch(function (e) {
          util.log('\u001b[01;31mERR: Could not save operator for channel ' + channel + '; ' + util.inspect(channelsOps[channel]) + '\u001b[0m');
        });
      }
    });

    client.say(from, "The user " + nick + " has been removed from the operators list successfully (i.e " + updatedChannels.join(', ') + ") and has been notified if currently online");
  }

  return true;
}

function listOperators(client, channelsOps, from, options) {
  var channel = options.channel || '';

  if (!channel.length) {
    client.say(from, "You're missing the channel!");
  } else if (!(channel in channelsOps)) {
    client.say(from, "I don't know this channel.");
  } else {
    util.log('Listing all operators in ' + channel + ' to ' + from);
    client.say(from, "There are currently " + channelsOps[channel].length + " users registered in " + channel +
      (channelsOps[channel].length > 0
      ? ' : ' + channelsOps[channel].join(', ')
      : '')
    );
  }

  return true;
}