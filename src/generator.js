const { capitalize } = require('./utils');
const {
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  IndexOperationModel,
  PointModel,
  GroupModel,
  ListModel,
  ArcModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
  MultiLineModel,
} = require('./model');


let cnt = 0;

class ANMLGenerator {
  generate(model) {

    this._symbolTable = model.getSymbolTable();

    this._indentStep = 2;

    let str = '';

    const symbolTable = model.getSymbolTable();
    for (let key in symbolTable) {
      const def = symbolTable[key];
      str += this.generateConstantDef(def, '');
    }
    str += '\n';

    const symbolDefs = model.getSymbolDefs();
    for (let key in symbolDefs) {
      const def = symbolDefs[key];
      str += this.generateUserDefinedShapeDef(def, '');
    }

    for (let shape of model.getObjects()) {
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
    // NOTE: this needs to come after CircleModel, because CircleModel
    // inherits from ArcModel
    else if (item instanceof ArcModel) {
      str += this.generateArc(item, indent);
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
    else if (item instanceof MultiLineModel) {
      str += this.generateMultiLine(item, indent);
    }
    else if (item instanceof GroupModel) {
      str += this.generateGroup(item, indent);
    }
    else if (item instanceof ListModel) {
      str += this.generateList(item, indent);
    }
    else if (item instanceof PointModel) {
      str += this.generatePoint(item, indent);
    }
    else {
      str += this.generateUserDefinedShape(item, indent);
    }
    return str;
  }

  generateArc(a, indent) {
    let str = indent + '(Arc\n';

    str += this.generateShapeAttrs(a, indent);

    const attrs = [ 'radius', 'startAngle', 'endAngle' ];

    str += this.generateAttrs(a, attrs, indent);
    str += indent + ')\n';
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

    str += indent + `  (x1 ${l.getX1()}) (y1 ${l.getY1()})\n`;
    str += indent + `  (x2 ${l.getX2()}) (y2 ${l.getY2()})\n`;
    str += indent + ')\n';
    return str;
  }

  generateMultiLine(l, indent) {
    let str = indent + '(MultiLine\n';
    str += this.generateShapeAttrs(l, indent);

    str += indent + '  (points\n'
    for (let point of l.getPoints()) {
      str += this.generateItem(point, indent + '    ');
    }

    str += indent + '  )\n'
    str += indent + ')\n';
    return str;
  }

  generateGroup(g, indent) {
    let str = indent + '(Group\n';

    str += this.generateShapeAttrs(g, indent);

    str += indent + '  (children\n'
    for (let child of g.getChildren()) {
      str += this.generateItem(child, indent + '    ');
    }
    str += indent + '  )\n'

    str += indent + ')\n';
    return str;
  }

  generateList(l, indent) {
    let str = indent + '(List\n';

    str += this.generateShapeAttrs(l, indent);

    const length = l.getLength();
    if (length !== undefined) {
      str += indent + `  (length ${length})\n`;
    }

    const ofType = l.getOf();
    if (ofType !== undefined) {
      str += indent + `  (of\n`;
      str += this.generateItem(l.getOf(), indent + '    ');
      str += indent + '  )\n';
    }

    str += indent + ')\n';
    return str;
  }

  generatePoint(p, indent) {
    let str = '';
    //str += indent + '(Point\n';
    //str += this.generateObjectAttrs(p, indent);
    //str += indent + ')\n';
    str += indent + `(Point (x ${p.getX()}) (y ${p.getY()}))\n`;
    return str;
  }

  generateUserDefinedShape(s, indent) {
    let str = indent + '(' + s.getType() + '\n';

    str += this.generateShapeAttrs(s, indent);

    const attrs = [];

    str += this.generateAttrs(s, attrs, indent);
    str += indent + ')\n';
    return str;
  }

  generateConstantDef(c, indent) {
    let str = `(def ${c.getIdentifier()} ${c.getValue()})\n`;
    return str;
  }

  generateUserDefinedShapeDef(s, indent) {
    let str = '(def ' + s.getType() + '\n';

    for (let child of s.getChildren()) {
      str += this.generateItem(child, indent + '  ');
    }

    str += ')\n\n';
    return str;
  }

  generateObjectAttrs(s, indent) {

    let str = '';
    //str += indent + `  (x ${s.getX()}) (y ${s.getY()})\n`;

    const name = s.getName();
    if (name !== undefined) {
      str += indent + `  (name ${name})\n`;
    }

    const dataKey = s.getDataKey();
    if (dataKey !== undefined) {
      str += indent + `  (dataKey ${dataKey})\n`;
    }

    const show = s.getShow();
    if (show !== undefined && show != s.defaultShow()) {
      str += this.generateAttrs(s, ['show'], indent);
    }

    const attrs = [ 'x', 'y' ];

    str += this.generateAttrs(s, attrs, indent);
    return str;
  }

  generateShapeAttrs(s, indent) {

    let str = '';
    //str += indent + `  (x ${s.getX()}) (y ${s.getY()})\n`;

    str += this.generateObjectAttrs(s, indent);

    const attrs = [
      'strokeWidth', 'strokeColor', 'fillColor',
    ];

    str += this.generateAttrs(s, attrs, indent);
    return str;
  }

  generateAttrs(s, attrs, indent) {
    let str = '';

    for (let attr of attrs) {
      const methodName = 'get' + capitalize(attr);
      const value = s[methodName]();
      let ret;
      if (value instanceof DataValueModel) {
        ret = this.generateDataAttr(attr, value, indent + '  ');
      }
      else if (value instanceof DataTernaryModel) {
        ret = this.generateDataTernaryAttr(attr, value, indent + '  ');
      }
      else if (value instanceof IndexOperationModel) {
        ret = this.generateIndexOperationAttr(attr, value, indent + '  ');
      }
      else {
        const defaultMethod = 'default' + capitalize(attr);
        const defaultValue = s[defaultMethod]();
        const finalValue = this._symbolOrValue(value);
        ret = this.generateAttr(attr, finalValue, defaultValue, indent + '  ');
      }

      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    return str;
  }

  _symbolOrValue(ident) {
    if (ident instanceof ConstantDefinitionModel) {
      return ident.getIdentifier();
    }
    else {
      return ident;
    }
  }

  generateAttr(key, value, defaultValue, indent) {
    if (value !== defaultValue) {
      return indent + '(' + key + ' ' + value + ')';
    }
    else {
      return '';
    }
  }

  generateDataTernaryAttr(key, v, indent) {
    let str = indent + '(' + key + ' ';
    const trueVal = this._symbolOrValue(v.getTrueValue());
    const falseVal = this._symbolOrValue(v.getFalseValue());
    const path = ['$data'].concat(v.getPath()).join('.');
    const ternaryStr = path + 
      ` ${v.getCondition()} ${v.getCheckValue()} ? ${trueVal} : ${falseVal}`;
    str += ternaryStr + ')';
    return str;
  }

  generateIndexOperationAttr(key, v, indent) {
    let str = indent + '(' + key + ' $index ' + v.getOperator() + ' ' + v.getFactor() + ')';
    return str;
  }

  generateDataAttr(key, value, indent) {
    let str = indent + '(' + key + ' ';
    const path = ['$data'].concat(value.getPath()).join('.');
    str += path + ')';
    return str;
  }
}



module.exports = {
  ANMLGenerator,
}
