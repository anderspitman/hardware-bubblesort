const { capitalize } = require('./utils');
const { Vector2 } = require('./math');
const {
  ANMLModel,
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  SymbolDefinitionModel,
  SymbolModel,
  ShapeModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
} = require('./model');


class ANMLParser {

  parse(text) {

    this._symbolTable = {};
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

        if (this._symbolDefs[model.getType()] === undefined) {
          this._symbolDefs[model.getType()] = model;
        }
        else {
          throw "Symbol " + model.getType() + " already defined";
        }
      }
    }

    model.setSymbolDefs(this._symbolDefs);
    model.setSymbolTable(this._symbolTable);

    return model;
  }

  _parseExpression(tokens) {

    if (tokens.shift() !== '(') {
      return null;
    }

    const type = tokens.shift();

    switch(type) {
      case 'def':
        return this._parseDefinition(tokens);
        break;
      case 'Circle':
      case 'Rectangle':
      case 'Triangle':
      case 'Line':
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
      symbol.setType(symbolDef.getType());
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
      case 'Line':
        Con = LineModel;
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

    const value = this._parseAttrValue(tokens);

    const closeParen = tokens.shift();

    return {
      name,
      value,
    };
  }

  _parseAttrValue(tokens) {

    let tok = tokens.shift();

    if (tok.startsWith('data')) {
      tokens.unshift(tok);
      return this._parseDataValue(tokens);
    }
    else {
      if (!isNaN(tok)) {
        return this._parseNumberValue(tok);
      }
      else {
        tokens.unshift(tok);
        return this._symbolOrValue(tokens);
      }
    }
  }

  _parseDataValue(tokens) {
    const pathTok = tokens.shift();
    const path = pathTok.split('.').slice(1);

    const tok = tokens.shift();

    if (tok === '==') {
      tokens.unshift(tok);
      const tern = this._parseTernaryExpression(tokens);
      tern.setPath(path);
      return tern;
    }
    else {
      const model = new DataValueModel();
      model.setPath(path);
      return model;
    }
  }

  _parseTernaryExpression(tokens) {

    const conditionTok = tokens.shift();
    // TODO: handle other data types
    const checkValue = Number(tokens.shift());
    const questionMark = tokens.shift();
    const trueVal = this._symbolOrValue(tokens);
    const colon = tokens.shift();
    const falseVal = this._symbolOrValue(tokens);
    //const closeParen = tokens.shift();

    const tern = new DataTernaryModel();
    tern.setCondition(conditionTok);
    tern.setCheckValue(checkValue);
    tern.setTrueValue(trueVal);
    tern.setFalseValue(falseVal);

    return tern;
  }

  _symbolOrValue(tokens) {
    const ident = tokens.shift();

    // check if identifier is a key into the symbol table, and use the value
    // from the table if so.
    if (this._symbolTable[ident] === undefined) {
      return ident;
    }
    else {
      return this._symbolTable[ident];
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
    return Number(tok);
  }

  _parseDefinition(tokens) {

    const ident = tokens.shift();

    const tok = tokens.shift();

    if (tok === '(') {
      tokens.unshift(tok);
      return this._parseSymbolDefinition(ident, tokens);
    }
    else {
      tokens.unshift(tok);
      return this._parseConstantDefinition(ident, tokens);
    }
  }

  _parseSymbolDefinition(ident, tokens) {
    const def = new SymbolDefinitionModel();
    const symbolName = ident;
    def.setType(symbolName);

    const shapes = this._parseShapeList(tokens);
    def.setChildren(shapes);

    return def
  }

  _parseConstantDefinition(ident, tokens) {
    const value = tokens.shift();

    const constDef = new ConstantDefinitionModel();
    constDef.setIdentifier(ident);
    constDef.setValue(value);

    if (this._symbolTable[ident] === undefined) {
      this._symbolTable[ident] = constDef;
    }
    else {
      throw `Constant ${ident} already defined`;
    }

    const closeParen = tokens.shift();
    // TODO: this is a hack to avoid returning null, but it doesn't do
    // anything
    return constDef;
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
