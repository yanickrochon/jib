
const UNKNOWN_ARG_PART = '?';
const WHITE_SPACE_CHAR = /\s/;


module.exports.split = splitArgs;



/**
Split the given argument string into tokenized argument object

Ex : splitArgs('1 2 3', ['a', 'b', 'c']);  --> { a: '1', b: '2', c: '3' }
     splitArgs('1 2 3', ['a', 'b']);  --> { a: '1', b: '2', '?': '3' }
     splitArgs('1 2 3', ['a']);  --> { a: '1', '?': '2 3' }
     splitArgs('"Hello World" "foo" 2', ['a', 'b', 'c']);  --> { a: 'Hello World', b: 'foo', c: '2' }
     splitArgs('"Hello World" "foo" 2', ['a', 'b', 'c']);  --> { a: 'Hello World', b: 'foo', c: '2' }
     splitArgs('"Hello World" "foo" 2', ['a', 'b']);  --> { a: 'Hello World', b: 'foo', '?': '2' }
     splitArgs('"Hello World" "foo" 2', ['a']);  --> { a: 'Hello World', '?': '"foo" 2' }

@param args {String}    an argument string
@param parts {Array}    an array of tokens
@return {Object}
*/
function splitArgs(args, parts) {
  var offset = 0;

  // make sure the unknown arg part is the last item
  if (parts.indexOf(UNKNOWN_ARG_PART) > -1) {
    parts.splice(parts.indexOf(UNKNOWN_ARG_PART), 1);
  }
  parts.push(UNKNOWN_ARG_PART);

  return parts.reduce(function (obj, part, index) {
    if (part === UNKNOWN_ARG_PART) {
      if (offset < args.length) {
        obj[UNKNOWN_ARG_PART] = args.substr(offset).trim();
        offset = args.length;
      }
    } else if (offset >= args.length) {
      obj[part] = undefined;
    } else /*if (offset < args.length)*/ {
      var token = readNextToken(args, offset);
      // read next token
      //console.log("Reading token", part, 'from', offset, args.substr(offset), token);
      obj[part] = token.value;
      offset = token.nextOffset;
    }

    return obj;
  }, {});
}


/**
Read the next token and return the information. The returned value is an object
composed of two keys: value and nextOffset

Ex: readNextToken('1 2 "Hello World" 4', 4)   -> { value: 'Hello World', nextOffset: 17 }

@param args {String}          a string argument
@param startOffset {Number}   the start offset in the string
@return Object
*/
function readNextToken(args, startOffset) {
  var isQuoted = false;
  var escaped = false;
  var quoteChar;
  var offset;

  while (startOffset < args.length && WHITE_SPACE_CHAR.test(args.charAt(startOffset))) {
    ++startOffset;
  }
  offset = startOffset;

  if (args.charAt(offset) === '"' || args.charAt(offset) === "'") {
    isQuoted = true;
    quoteChar = args.charAt(offset);
    startOffset = ++offset;
  }

  while (offset < args.length) {
    //console.log("*** OFFSET", offset, '/', args.length);
    if (escaped) {
      escaped = false;
      ++offset;
    } else if ( (isQuoted && args.charAt(offset) === quoteChar) || (!isQuoted && WHITE_SPACE_CHAR.test(args.charAt(offset))) ) {
      break;
    } else {
      if (args.charAt(offset) === '\\') {
        escaped = true;
      }
      ++offset;
    }
  }

  return {
    value: args.substring(startOffset, offset).replace('\\', ''),
    nextOffset: offset + 1
  };
}

