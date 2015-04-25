# JIB

JavaScript IRC Bot


## Installation

```
$ git clone https://github.com/yanickrochon/jib.git
```

The `conf.default` folder contains the default configuration template. For Git to work properly, as well as `jib`, copy-rename `conf.default` to `conf` and edit the `conf` folder.

**Note:** do not edit the `conf.default` folder.

**Note:** This project is not on npm.


## Configuration

The bot will update configuration files, and these can be manually edited. Each configuration is saved as JSON. Do not modify the files while the bot is running, as it may overwrite them; use the bot's commands while it is running to change it's configurations.

All configurations are kept inside the `conf` directory.

### client.json

The `client.json` configuration file declares the options when initializing the client. Since `jib` depends on the [irc](https://github.com/martynsmith/node-irc) package, refer to it's documentation for more options.

### #channel Directories

Channel configurations declares channel specific setup that `jib` should manage. The bot will join each channels automatically. To specify a new channel configuration, create a new folder inside `conf`, named after the channel. For example, creating `conf/#javascript` would create a configuration folder for the channel `#javascript`.


## Usage

```
$ node jib.js
```


## Plugins

Plugins are the parts that handles requests in channels. To add a plugin to any channel configuration, simply create a `<plugin>.json` file inside the channel configuration folder. Without the configuration file, the plugin will not be used in a channel.


### Operators

The operators plugin will auto-op all users defined in it's configuration. TO use the plugin in a channel, create a `operstors.json` inside the channel configuration folder and declare an array of users to give `+o` mode to.

#### Exemple

```
[
  "bob",
  "_mistercat"
]
```


## License

Copyright (c) 2015 Yanick Rochon <yanick.rochon@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.