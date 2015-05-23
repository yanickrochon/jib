
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
function operators(client, config) {

  client.addListener('join', function (channel, nick, message) {
    isPluginEnabled(channel, config) && isSelfChanOp(client, channel) && makeOp(client, channel, config[channel].users, nick);
  });

  client.addListener('nick', function (oldnick, newnick, channels, message) {
    channels.forEach(function (channel) {
      isPluginEnabled(channel, config) && isSelfChanOp(client, channel) && makeOp(client, channel, config[channel].users, newnick);
    });
  });

  client.addListener('pm', function (from, message) {
    var match = message.match(CMD_PATTERN);

    if (!(Object.keys(config).some(function (channel) {
      return isChanOp(client, channel, from) || (isPluginEnabled(channel, config) && isKnownOp(client, channel, config[channel].users, from));
    }))) {
      client.say(from, 'Who the heck are you? Stop bothering me!');
    } else if (!(match && processCmd(client, config, from, match[1].toLowerCase(), match[2] || ''))) {
      client.say(from, 'What? If you want "help", just ask!');
    }
  });

}


/**
Check if this plugin is enabled (has configuration) for the given channel
@param channel the channel
@param config the plugin config
@return boolean
*/
function isPluginEnabled(channel, config) {
  return config && config[channel];
}


/**
Make sure that we are a channel operator in the given channel
@param client  the irc client interace
@param channel  the channel we want to check
@return boolean
*/
function isSelfChanOp(client, channel) {
  return isChanOp(client, channel, client.opt.nick);
}


/**
Check if we know this nick as an operator

@param client     the irc client interface
@param channel    the channel to check
@param operators  a list of operators to check from
@param nick       the nick to validate
*/
function isKnownOp(client, channel, operators, nick) {
  var isKnown = false;

  // TODO : add extra validation with WHOIS information to minimize impersonation
  //        the config should be an object instead of an array. The object should
  //        contain the last WHOIS information

  if (operators !== null && typeof operators === 'object') {
    isKnown = nick in operators;
  } else {
    util.log('\u001b[01;31mERR: Operators config is not valid for channel ' + channel + '; ' + util.inspect(operators) + '\u001b[0m');
  }

  return isKnown;
}


/**
Check if the given nick is a channel operator
@param client     the irc client interface
@param channel    the channel we want to check
@param nick       the nick to check
@return boolean   true if nick is an known operator
*/
function isChanOp(client, channel, nick) {
  //var chanInfo = client.chans[channel];
  var isOp = false;

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
Return the WHOIS information for the given nick. First, try to see if
was have this information cached in the client, or fetch the information
from the server
@param client the client interface
@param nick  the nick to fetch WHOIS
@return Object|null
*/
function getWhois(client, nick) {
  return Promise.resolve(null);
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

  if (isKnownOp(client, channel, operators, nick)) {
    // do not OP twice
    if (!isChanOp(client, channel, operators, nick)) {
      client.send('MODE', channel, '+o', nick);
    }
    result = true;
  }

  return result;
}


function processCmd(client, config, from, cmd, args) {
  var valid = false;

  if (cmd === 'help') {
    client.say(from, 'ADDOP <nick> <channel> ...   Register a new operator for the specified channels (separated by space).');
    client.say(from, 'REMOP <nick> [channel] ...   Remove nick from the specified channels (separated by space). If no channels are given, the nick will be removed from all known channels.');
    client.say(from, 'LISTOPS <channel>            List all registered operators in the given channel.')
    valid = true;
  } else if (cmd === 'addop') {
    valid = addOperator(client, config, from, argsUtil.split(args || '', ['nick']));
  } else if (cmd === 'remop') {
    valid = removeOperator(client, config, from, argsUtil.split(args || '', ['nick']));
  } else if (cmd === 'listops') {
    valid = listOperators(client, config, from, argsUtil.split(args || '', ['channel']));
  }

  return valid;
}


function addOperator(client, config, from, options) {
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
    getWhois(client, nick).then(function (whois) {
      channels.forEach(function (channel) {
        if (channel in config) {
          util.log('Adding operator ' + nick + ' to ' + channel + ' by ' + from);

          if (!config[channel]) {
            // handling new channel
            config[channel] = {
              users: {}
            };
          }

          if (!(nick in config[channel].users)) {

            // TODO : if in channel, set OP to nick

            config[channel].users[nick] = whois;
            client.say(nick, 'You have been added OP status in ' + channel + ' by ' + from);

            updatedChannels.push(channel);

            // TODO : make sure channel config dir exists

            config.saveJson(path.join(channel, CONFIG_NAME), config[channel]).then(function () {
              util.log('Channel operators saved for ' + channel);
            }).catch(function (e) {
              util.log('\u001b[01;31mERR: Could not save operator for channel ' + channel + '; ' + util.inspect(config[channel]) + '\u001b[0m');
            });
          }
        }
      });

      client.say(from, "The user " + nick + " has been successfully added to the operators list in " + updatedChannels.join(', ') + ", and has been notified if currently online");
    });
  }

  return true;
}

function removeOperator(client, config, from, options) {
  var nick = options.nick || '';
  var channels = (options['?'] || '').split(WHITESPACE_PATTERN).filter(function (channel) {
    return channel.length;
  });
  var updatedChannels = [];

  if (!channels.length) {
    channels = Object.keys(config);
  }

  if (!nick.length) {
    client.say(from, "You're missing the nickname!");
  } else {
    getWhois(client, nick).then(function (whois) {
      channels.forEach(function (channel) {
        var nickIsOp = (channel in config) && (config[channel].users) && (nick in config[channel].users);

        if (nickIsOp >= 0) {
          util.log('Removing operator ' + nick + ' from ' + channel + ' by ' + from);
          delete config[channel].users[nick];

          updatedChannels.push(channel);

          client.say(nick, 'You have been revoked OP status in ' + channel + ' by ' + from);

          // TODO : if in channel, take OP from nick

          // TODO : make sure channel config dir exists

          config.saveJson(path.join(channel, CONFIG_NAME), config[channel]).then(function () {
            util.log('Channel operators saved for ' + channel);
          }).catch(function (e) {
            util.log('\u001b[01;31mERR: Could not save operator for channel ' + channel + '; ' + util.inspect(config[channel]) + '\u001b[0m');
          });
        }
      });

      client.say(from, "The user " + nick + " has been successfully removed from the operators list in " + updatedChannels.join(', ') + ", and has been notified if currently online");
    });
  }

  return true;
}

function listOperators(client, config, from, options) {
  var channel = options.channel || '';

  if (!channel.length) {
    client.say(from, "You're missing the channel!");
  } else if (!(channel in config)) {
    client.say(from, "I do not handle this channel.");
  } else {
    var operators = Object.keys(config[channel].users || {});

    util.log('Listing all operators in ' + channel + ' to ' + from);

    if (operators.length) {
      Promise.all(operators.map(function (nick) {
        return getWhois(client, nick);
      })).then(function () {
        var whoisList = arguments;

        client.say(from, "There are currently " + operators.length + " users registered has operator in " + channel +
          ' : ' + operators.map(function (op, index) {
            var whois = whoisList[index];

            // TODO : add some WHOIS info, if available

            return op;
          }).join(', ')
        );
      }).catch(function (e) {
        util.log('\u001b[01;31mERR: Failed to get WHOIS information: ' + util.inspect(e) + '\u001b[0m');
        client.say(from, 'Sorry, there was a problem listing OPs for ' + channel);
      });
    } else {
      client.say(from, "There are currently no users registered has operator in " + channel);
    }
  }

  return true;
}