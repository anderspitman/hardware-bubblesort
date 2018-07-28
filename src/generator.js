const { capitalize } = require('./utils');
const {
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
} = require('./model');


class ANMLGenerator {
  generate(model) {

    this._indentStep = 2;

    let str = '';

    const symbolDefs = model.getSymbolDefs();
    for (let key in symbolDefs) {
      const def = symbolDefs[key];
      str += this.generateSymbolDef(def, '');
    }

    for (let shape of model.getShapes()) {
      str += this.generateItem(shape, '');    
      str += '\n';
    }

    return str;
  }

  generateItem(item, indent) {
    let str = '';

    if (item instanceof CircleModel) {
      str += this.generateCircle(item, indent);
    }
    else if (item instanceof RectangleModel) {
      str += this.generateRectangle(item, indent);
    }
    else if (item instanceof TriangleModel) {
      str += this.generateTriangle(item, indent);
    }
    else if (item instanceof LineModel) {
      str += this.generateLine(item, indent);
    }
    else {
      str += this.generateSymbol(item, indent);
    }
    return str;
  }

  generateCircle(c, indent) {
    let str = indent + '(Circle\n';

    const attrs = [
      [ 'x', c, 0 ],
      [ 'y', c, 0 ],
      [ 'radius', c, 10 ],
    ];

    str += this.generateAttrs(attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateRectangle(r, indent) {
    let str = indent + '(Rectangle\n';

    const attrs = [
      [ 'x', r, 0 ],
      [ 'y', r, 0 ],
      [ 'width', r, 10 ],
      [ 'height', r, 10 ],
    ];

    str += this.generateAttrs(attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateTriangle(r, indent) {
    let str = indent + '(Triangle\n';

    const attrs = [
      [ 'x', r, 0 ],
      [ 'y', r, 0 ],
    ];

    str += this.generateAttrs(attrs, indent);
    str += indent + `  (x1 ${r.getX1()}) (y1 ${r.getY1()})\n`;
    str += indent + `  (x2 ${r.getX2()}) (y2 ${r.getY2()})\n`;
    str += indent + `  (x3 ${r.getX3()}) (y3 ${r.getY3()})\n`;
    str += indent + ')\n';
    return str;
  }

  generateLine(r, indent) {
    let str = indent + '(Line\n';

    const attrs = [
      [ 'x', r, 0 ],
      [ 'y', r, 0 ],
      [ 'strokeWidth', r, r.defaultStrokeWidth() ],
    ];

    str += this.generateAttrs(attrs, indent);
    str += indent + `  (x1 ${r.getX1()}) (y1 ${r.getY1()})\n`;
    str += indent + `  (x2 ${r.getX2()}) (y2 ${r.getY2()})\n`;
    str += indent + ')\n';
    return str;
  }
  generateSymbol(s, indent) {
    let str = indent + '(' + s.getName() + '\n';

    const attrs = [
      [ 'x', s, 0 ],
      [ 'y', s, 0 ],
    ];

    str += this.generateAttrs(attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateSymbolDef(s, indent) {
    let str = '(def ' + s.getName() + '\n';

    for (let child of s.getChildren()) {
      str += this.generateItem(child, indent + '  ');
    }
    //const attrs = [
    //  [ 'x', s, 0 ],
    //  [ 'y', s, 0 ],
    //];

    //str += this.generateAttrs(attrs);
    str += ')\n\n';
    return str;
  }

  generateAttrs(attrs, indent) {
    let str = '';

    for (let attr of attrs) {
      const methodName = 'get' + capitalize(attr[0]);
      const ret = this.generateAttr(
        attr[0], attr[1][methodName](), attr[2], indent + '  ');
      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    return str;
  }

  generateAttr(key, value, defaultValue, indent) {
    return indent + '(' + key + ' ' + value + ')';
    //if (value !== defaultValue) {
    //  return indent + '(' + key + ' ' + value + ')';
    //}
    //else {
    //  return '';
    //}
  }
}



module.exports = {
  ANMLGenerator,
}
