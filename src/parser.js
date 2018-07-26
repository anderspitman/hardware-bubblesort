const { ANMLModel, CircleModel } = require('./model');


class ANMLParser {
  parse(text) {

    const commentsRemoved = text.split('\n')
      .filter(line => !line.startsWith('#')).join('')

    console.log(commentsRemoved);

    const model = new ANMLModel();

    //text = text.replace(/\s/g, '')
    const tokens = this._tokenize(text)
    //console.log(tokens)

    let shapes;
    if (tokens[0] === '(') {
      shapes = this._parse(tokens)
    }
    else {
      throw "Text must begin with an S-Expression ('(')"
    }

    model.setShapes(shapes);
    return model;
  }

  _parse(expr) {

    const root = [];

    if (expr.shift() !== '(') {
      throw "Must begin with (";
    }

    const type = expr.shift();

    switch(type) {
      case 'Circle':
        expr.unshift('Circle');
        const circle = this._parseCircle(expr);
        root.push(circle);
        break;
      default:
        throw "Invalid expression type";
        break;
    }

    return root
  }

  _parseSymbol(tokens) {
    const symbol = {};

    symbol.type = tokens.shift();
    symbol.attrs = this._parseAttributes(tokens);

    return symbol;
  }

  _parseAttributes(tokens) {
    const attrs = [];

    let done = false;
    while(!done) {
      const attr = this._parseAttribute(tokens);

      if (!attr) {
        done = true;
      }
      else {
        attrs.push(attr);
      }
    }

    return attrs;
  }

  _parseAttribute(tokens) {

    const openParen = tokens.shift();

    if (openParen === ')') {
      return null;
    }

    const name = tokens.shift();
    const value = this._parseAttrValue(tokens);

    const closeParen = tokens.shift();

    return {
      name,
      value,
    };
  }

  _parseAttrValue(tokens) {

    let tok = tokens.shift();

    if (tok[0] === '"' || tok[0] === "'") {
      tokens.unshift(tok);
      return this._parseStringValue(tokens);
    }
    else {
      return this._parseNumberValue(tok);
    }
  }

  _parseStringValue(tokens) {
    let tok = tokens.shift();

    let str = "";

    let a = Array.from(tok);

    const openParen = a.shift();

    let char = a.shift();
    while(char !== '"' && char !== "'") {
      str += char;
      char = a.shift();

      if (char === undefined) {
        tok = tokens.shift();
        a = Array.from(tok);
        str += ' ';
        char = a.shift();
      }
    }

    return str;
  }

  _parseNumberValue(tok) {
    if (!isNaN(tok)) {
      tok = Number(tok);
    }

    return tok;
  }

  _parseCircle(tokens) {
    const symbol = this._parseSymbol(tokens);

    const circle = new CircleModel();

    for (let attr of symbol.attrs) {
      switch(attr.name) {
        case 'name':
          circle.setName(attr.value);
          break;
        case 'x':
          circle.setX(attr.value);
          break;
        case 'y':
          circle.setY(attr.value);
          break;
        case 'radius':
          circle.setRadius(attr.value);
          break;
      }
    }

    return circle;
  }

  _tokenize(text) {
    const tokens = [];
    let currentToken = ''

    function saveToken(token) {
      if (token.length > 0) {
        tokens.push(token)
        currentToken = ''
      }
    }

    for (let char of text) {
      if (char === '(' || char === ')') {
        saveToken(currentToken)
        tokens.push(char)
      }
      else if (isWhitespace(char)) {
        saveToken(currentToken)
      }
      else {
        currentToken += char
      }
    }

    return tokens
  }
}

function isWhitespace(char) {
  return /\s/.test(char)
}


module.exports = {
  ANMLParser,
};
