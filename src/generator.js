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

    str += this.generateShapeAttrs(c, indent);

    const attrs = [ 'radius' ];

    str += this.generateAttrs(c, attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateRectangle(r, indent) {
    let str = indent + '(Rectangle\n';

    str += this.generateShapeAttrs(r, indent);

    const attrs = [ 'width', 'height' ];

    str += this.generateAttrs(r, attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateTriangle(t, indent) {
    let str = indent + '(Triangle\n';

    str += this.generateShapeAttrs(t, indent);

    const attrs = [];

    str += this.generateAttrs(t, attrs, indent);
    str += indent + `  (x1 ${t.getX1()}) (y1 ${t.getY1()})\n`;
    str += indent + `  (x2 ${t.getX2()}) (y2 ${t.getY2()})\n`;
    str += indent + `  (x3 ${t.getX3()}) (y3 ${t.getY3()})\n`;
    str += indent + ')\n';
    return str;
  }

  generateLine(l, indent) {
    let str = indent + '(Line\n';

    str += this.generateShapeAttrs(l, indent);

    const attrs = [ 'strokeWidth' ];

    str += this.generateAttrs(l, attrs, indent);
    str += indent + `  (x1 ${l.getX1()}) (y1 ${l.getY1()})\n`;
    str += indent + `  (x2 ${l.getX2()}) (y2 ${l.getY2()})\n`;
    str += indent + ')\n';
    return str;
  }

  generateSymbol(s, indent) {
    let str = indent + '(' + s.getName() + '\n';

    str += this.generateShapeAttrs(s, indent);

    const attrs = [];

    str += this.generateAttrs(s, attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateSymbolDef(s, indent) {
    let str = '(def ' + s.getName() + '\n';

    for (let child of s.getChildren()) {
      str += this.generateItem(child, indent + '  ');
    }

    str += ')\n\n';
    return str;
  }

  generateShapeAttrs(s, indent) {

    let str = '';
    const attrs = [
      'x', 'y', 'strokeWidth', 'strokeColor', 'fillColor',
    ];

    str += this.generateAttrs(s, attrs, indent);
    return str;
  }

  generateAttrs(s, attrs, indent) {
    let str = '';

    for (let attr of attrs) {
      const methodName = 'get' + capitalize(attr);
      const ret = this.generateAttr(
        attr, s[methodName](), indent + '  ');
      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    return str;
  }

  generateAttr(key, value, indent) {
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
