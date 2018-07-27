const { capitalize } = require('./utils');
const { Vector2 } = require('./math');
const {
  ANMLModel,
  SymbolDefinitionModel,
  SymbolModel,
  ShapeModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
} = require('./model');


class ANMLParser {

  parse(text) {

    this._symbolDefs = {};

    const commentsRemoved = text.split('\n')
      .filter(line => !line.startsWith('#')).join('')

    const model = new ANMLModel();

    const tokens = this._tokenize(commentsRemoved)

    const shapes = [];
    model.setShapes(shapes);

    while (true) {
      const model = this._parseExpression(tokens)

      if (model === null) {
        break;
      }

      if (model instanceof ShapeModel) {
        shapes.push(model);
      }
      else if (model instanceof SymbolDefinitionModel) {

        if (this._symbolDefs[model.getName()] === undefined) {
          this._symbolDefs[model.getName()] = model;
        }
        else {
          throw "Symbol " + model.getName() + " already defined";
        }
      }
    }

    model.setSymbolDefs(this._symbolDefs);

    return model;
  }

  _parseExpression(tokens) {

    if (tokens.shift() !== '(') {
      return null;
    }

    const type = tokens.shift();

    switch(type) {
      case 'def':
        return this._parseSymbolDefinition(tokens);
        break;
      case 'Circle':
      case 'Rectangle':
      case 'Triangle':
        tokens.unshift(type);
        return this._parseShape(tokens);
      default:

        tokens.unshift(type);
        return this._parseSymbol(tokens);
        
        break;
    }
  }

  _parseSymbol(tokens) {
    const type = tokens.shift();
    const symbolDef = this._symbolDefs[type];
    if (symbolDef !== undefined) {
      const symbol = new SymbolModel();
      symbol.setName(symbolDef.getName());
      symbol.setChildren(symbolDef.getChildren());

      this._setAttrs(symbol, tokens);
      return symbol;
    }
    else {
      throw "Invalid expression type " + type;
    }
  }

  _parseShapeList(tokens) {

    let tok = tokens.shift();

    const shapes = [];

    while (tok !== ')') {
      const shape = this._parseShape(tokens);
      shapes.push(shape);
      tok = tokens.shift();
    }

    return shapes;
  }

  _parseShape(tokens) {

    const type = tokens.shift();

    let Con;
    switch(type) {
      case 'Circle':
        Con = CircleModel;
        break;
      case 'Rectangle':
        Con = RectangleModel;
        break;
      case 'Triangle':
        Con = TriangleModel;
        break;
      default:
        tokens.unshift(type);
        return this._parseSymbol(tokens);
        break;
    }

    const shape = new Con();

    this._setAttrs(shape, tokens);

    return shape;
  }

  _setAttrs(shape, tokens) {

    const attrs = this._parseAttributes(tokens);
    for (let attr of attrs) {
      const methodName = 'set' + capitalize(attr.name);
      if (shape[methodName] === undefined) {
        throw "Invalid attribute: " + attr.name;
      }
      shape[methodName](attr.value);
    }
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

    let value;
    // TODO: handling vertices as a special case. Make the parsing more
    // general
    if (name === 'vertices') {
      value = this._parseVertices(tokens);
    }
    else {
      value = this._parseAttrValue(tokens);
    }

    const closeParen = tokens.shift();

    return {
      name,
      value,
    };
  }

  _parseVertices(tokens) {
    return [
      this._parseVertex(tokens),
      this._parseVertex(tokens),
      this._parseVertex(tokens),
    ];

    const closeParen = tokens.shift();
  }

  _parseVertex(tokens) {
    // open paren
    tokens.shift();
    // x
    // open paren
    tokens.shift();
    // name
    tokens.shift();
    const xVal = Number(tokens.shift());
    // close paren
    tokens.shift();
    // y
    // open paren
    tokens.shift();
    // name
    tokens.shift();
    const yVal = Number(tokens.shift());
    // close paren
    tokens.shift();
    // close paren
    tokens.shift();

    const vertex = new Vector2({ x: xVal, y: yVal });
    return vertex;
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

  _parseSymbolDefinition(tokens) {
    const def = new SymbolDefinitionModel();
    const symbolName = tokens.shift();
    def.setName(symbolName);

    const shapes = this._parseShapeList(tokens);
    def.setChildren(shapes);

    return def
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
