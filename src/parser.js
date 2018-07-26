const { ANMLModel, CircleModel, RectangleModel } = require('./model');


class ANMLParser {
  parse(text) {

    const commentsRemoved = text.split('\n')
      .filter(line => !line.startsWith('#')).join('')

    console.log(commentsRemoved);

    const model = new ANMLModel();

    //text = text.replace(/\s/g, '')
    const tokens = this._tokenize(text)
    //console.log(tokens)

    const shapes = [];
    model.setShapes(shapes);

    while (true) {
      const shape = this._parse(tokens)

      if (shape === null) {
        break;
      }

      shapes.push(shape);
    }

    return model;
  }

  _parse(expr) {

    if (expr.shift() !== '(') {
      return null;
    }

    const type = expr[0];

    let shape;
    switch(type) {
      case 'Circle':
        shape = this._parseCircle(expr);
        break;
      case 'Rectangle':
        shape = this._parseRectangle(expr);
        break;
      default:
        throw "Invalid expression type";
        break;
    }

    return shape;
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

  _parseRectangle(tokens) {
    const symbol = this._parseSymbol(tokens);

    const rect = new RectangleModel();

    for (let attr of symbol.attrs) {
      switch(attr.name) {
        case 'name':
          rect.setName(attr.value);
          break;
        case 'x':
          rect.setX(attr.value);
          break;
        case 'y':
          rect.setY(attr.value);
          break;
        case 'width':
          rect.setWidth(attr.value);
          break;
        case 'height':
          rect.setHeight(attr.value);
          break;
      }
    }

    return rect;
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
