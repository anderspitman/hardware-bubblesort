const { Vector2 } = require('./math');


class ShapeModel {

  constructor() {
    this._x = 0;
    this._y = 0;
  }

  setName(value) {
    this._name = value;
  }

  getX() {
    return this._x;
  }
  setX(value) {
    this._x = value;
  }

  getY() {
    return this._y;
  }
  setY(value) {
    this._y = value;
  }
}


class CircleModel extends ShapeModel {
  constructor() {
    super();
    this._radius = 10;
  }

  getRadius() {
    return this._radius;
  }
  setRadius(value) {
    this._radius = value;
  }

  intersects(point) {
    const thisCenter = new Vector2({ x: this.getX(), y: this.getY() });
    const distance = point.subtract(thisCenter).getLength();
    return distance <= this._radius;
  }
}


class ANMLModel {
  constructor() {
    this._shapes = [];
  }

  add(shape) {
    this._shapes.push(shape);
  }

  getShapes() {
    return this._shapes;
  }

  setShapes(value) {
    this._shapes = value;
  }
}


class ANMLRenderer {
  constructor({ domParentId }) {
    this.parent = document.getElementById(domParentId);
    const dim = this.parent.getBoundingClientRect();

    this.canvas = document.createElement('canvas');
    this.canvas.width = dim.width;
    this.canvas.height = dim.height;
    this.canvas.style.width = dim.width;
    this.canvas.style.height = dim.height;
    this.parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', (e) => {
      const clickPoint = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseDownCallback !== undefined) {
        this.onMouseDownCallback(clickPoint);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const point = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseUpCallback !== undefined) {
        this.onMouseUpCallback(point);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const point = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseMoveCallback !== undefined) {
        this.onMouseMoveCallback(point);
      }
    });
  }

  render(model) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let shape of model.getShapes()) {
      if (shape instanceof CircleModel) {
        this.drawCircle(shape);
      }
    }
  }

  onMouseDown(callback) {
    this.onMouseDownCallback = callback;
  }

  onMouseUp(callback) {
    this.onMouseUpCallback = callback;
  }

  onMouseMove(callback) {
    this.onMouseMoveCallback = callback;
  }

  drawCircle(c) {
    this.ctx.beginPath();
    this.ctx.arc(c.getX(), c.getY(), c.getRadius(), 0, 2*Math.PI); 
    this.ctx.fill();
    this.ctx.stroke();
  }
}


class ANMLEditor {
  constructor({ domParentId }) {
    this.parent = document.getElementById(domParentId);
    this.textArea = document.createElement('textarea');
    this.textArea.rows = 10;
    this.textArea.cols = 40;
    this.parent.appendChild(this.textArea);

    this.generator = new ANMLGenerator();

    this.textArea.addEventListener('keyup', (e) => {
      if (this.onChangeCallback !== undefined) {
        const text = this.textArea.value;
        this.onChangeCallback(text);
      }
    });
  }

  onChange(callback) {
    this.onChangeCallback = callback;
  }

  update(model) {

    if (this.textArea !== document.activeElement) {
      const text = this.generator.generate(model);
      this.textArea.value = text;
    }
  }
}


class ANMLGenerator {
  generate(model) {

    let str = '';

    for (let shape of model.getShapes()) {
      if (shape instanceof CircleModel) {
        str += this.generateCircle(shape);
      }
    }

    return str;
  }

  generateCircle(c) {
    let str = '(Circle\n';

    const attrs = [
      [ 'x', c.getX.bind(c), 0 ],
      [ 'y', c.getY.bind(c), 0 ],
      [ 'radius', c.getRadius.bind(c), 10 ],
    ];

    for (let attr of attrs) {
      const ret = this.generateAttr(attr[0], attr[1](), attr[2]);
      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    str += ')';
    return str;
  }

  generateAttr(key, value, defaultValue, post = '') {
    if (value !== defaultValue) {
      return '  (' + key + ' ' + value + ')' + post;
    }
    else {
      return '';
    }
  }
}


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

fetch('/test.anml').then(response => {
  return response.text();
})
.then(text => {
  main(text)
})

function main(anmlFileText) {
  console.log(anmlFileText);
  const parser = new ANMLParser();
  let model = parser.parse(anmlFileText);
  const renderer = new ANMLRenderer({ domParentId: 'renderer' });
  const generator = new ANMLGenerator();
  const editor = new ANMLEditor({ domParentId: 'editor' });

  // TODO: clicking on the edge of the object then dragging causes the center
  // point of the object to jump to where the mouse is.
  let dragObj = null;
  renderer.onMouseDown((point) => {
    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(point);

      if (intersects) {
        dragObj = shape;
        break;
      }
    }
  });

  renderer.onMouseUp((point) => {
    dragObj = null;
  });

  renderer.onMouseMove((point) => {
    if (dragObj !== null) {
      dragObj.setX(point.x);
      dragObj.setY(point.y);
    }
  });

  editor.onChange((text) => {
    try {
      const newModel = parser.parse(text);
      model = newModel;
    }
    catch (e) {
      console.log(e);
    }
  });

  function render() {
    renderer.render(model);
    generator.generate(model);
    editor.update(model);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
