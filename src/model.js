const { Vector2 } = require('./math');

function processIndexValue(shape, indexValue) {
  if (indexValue instanceof IndexOperationModel) {
    switch(indexValue.getOperator()) {
      case '*':
        const val = shape.getListIndex() * indexValue.getFactor();
        return val;
        break;
      default:
        throw "Invalid operator";
        break;
    }
  }
  else {
    return indexValue;
  }
}

class ANMLModel {
  constructor() {
    this._shapes = [];
  }

  add(shape) {
    this._shapes.push(shape);
  }

  getSymbolTable() {
    return this._symbolTable;
  }
  setSymbolTable(value) {
    this._symbolTable = value;
  }

  getSymbolDefs() {
    return this._symbolDefs;
  }
  setSymbolDefs(value) {
    this._symbolDefs = value;
  }

  getShapes() {
    return this._shapes;
  }
  setShapes(value) {
    this._shapes = value;
  }

  update(data) {
    for (let shape of this.getShapes()) {

      if (shape instanceof GroupModel) {
        for (let child of shape.getChildren()) {
          const dataKey = child.getDataKey();

          if (dataKey !== undefined) {
            child.setData(data[dataKey]);
          }
        }
      }
      else {
        const dataKey = shape.getDataKey();

        if (dataKey !== undefined) {
          shape.setData(data[dataKey]);
        }
      }
    }
  }
}


class ConstantDefinitionModel {
  getIdentifier() {
    return this._ident;
  }
  setIdentifier(value) {
    this._ident = value;
  }

  getValue() {
    return this._value;
  }
  setValue(value) {
    this._value = value;
  }
}


class DataValueModel {
  getPath() {
    return this._path;
  }
  setPath(value) {
    this._path = value;
  }
}


class IndexOperationModel {
  getOperator() {
    return this._operator;
  }
  setOperator(value) {
    this._operator = value;
  }

  getFactor() {
    return this._factor;
  }
  setFactor(value) {
    this._factor = value;
  }
}


class DataTernaryModel {
  getPath() {
    return this._path;
  }
  setPath(value) {
    this._path = value;
  }

  getCondition() {
    return this._condition;
  }
  setCondition(value) {
    this._condition = value;
  }

  getCheckValue() {
    return this._checkValue;
  }
  setCheckValue(value) {
    this._checkValue = value;
  }

  getTrueValue() {
    return this._trueValue;
  }
  setTrueValue(value) {
    this._trueValue = value;
  }

  getFalseValue() {
    return this._falseValue;
  }
  setFalseValue(value) {
    this._falseValue = value;
  }
}


class UserDefinedShapeDefinitionModel {
  getType() {
    return this._type;
  }
  setType(value) {
    this._type = value;
  }

  getChildren() {
    return this._children;
  }
  setChildren(value) {
    this._children = value;
  }
}


class ShapeModel {

  constructor() {
    this._data = this.defaultData();
    this._x = this.defaultX();
    this._y = this.defaultY();
    this._strokeWidth = this.defaultStrokeWidth();
    this._strokeColor = this.defaultStrokeColor();
    this._fillColor = this.defaultFillColor();
  }

  getName() {
    return this._name;
  }
  setName(value) {
    this._name = value;
  }

  getDataKey() {
    return this._dataKey;
  }
  setDataKey(value) {
    this._dataKey = value;
  }

  defaultData() {
    return {};
  }
  getData() {
    return this._data;
  }
  setData(value) {
    this._data = value;
  }

  defaultX() {
    return 0;
  }
  getX() {
    return this._x;
  }
  setX(value) {
    this._x = value;
  }

  defaultY() {
    return 0;
  }
  getY() {
    return this._y;
  }
  setY(value) {
    this._y = value;
  }

  defaultStrokeWidth() {
    return 1;
  }
  getStrokeWidth() {
    return this._strokeWidth;
  }
  setStrokeWidth(value) {
    this._strokeWidth = value;
  }

  defaultStrokeColor() {
    return 'SteelBlue';
  }
  getStrokeColor() {
    return this._strokeColor;
  }
  setStrokeColor(value) {
    this._strokeColor = value;
  }

  defaultFillColor() {
    return 'SteelBlue';
  }
  getFillColor() {
    return this._fillColor;
  }
  setFillColor(value) {
    this._fillColor = value;
  }

  // TODO: These are only used for objects that are part of a list. Seems like
  // a hack to have this here.
  getListIndex() {
    return this._index;
  }
  setListIndex(value) {
    this._index = value;
  }
}


class UserDefinedShapeModel extends ShapeModel {

  getType() {
    return this._type;
  }
  setType(value) {
    this._type = value;
  }

  getChildren() {
    return this._children;
  }
  setChildren(value) {
    this._children = value;
  }

  intersects(point) {
    for (let child of this.getChildren()) {

      const x = processIndexValue(this, this.getX());
      const y = processIndexValue(this, this.getY());

      const thisPos = new Vector2({ x, y });
      const offsetPoint = point.subtract(thisPos);
      if (child.intersects(offsetPoint)) {
        return true;
      }
    }
    return false;
  }
}


class GroupModel extends ShapeModel {

  // TODO: there should maybe be a default value here
  getChildren() {
    return this._children;
  }
  setChildren(value) {
    this._children = value;
  }

  intersects(point) {
    for (let child of this.getChildren()) {

      const thisPos = new Vector2({ x: this.getX(), y: this.getY() });
      const offsetPoint = point.subtract(thisPos);
      if (child.intersects(offsetPoint)) {
        return true;
      }
    }
    return false;
  }
}


class ListModel extends ShapeModel {

  constructor() {
    super();
    this._length = this.defaultLength();
  }

  getOf() {
    return this._itemType;
  }
  setOf(value) {
    this._itemType = value;
  }

  defaultLength() {
    return undefined;
  }
  getLength() {
    return this._length;
  }
  setLength(value) {
    this._length = value;
  }

  getChildren() {
    return this._children;
  }
  setChildren(value) {
    this._children = value;
  }

  intersects(point) {
    for (let child of this.getChildren()) {

      const thisPos = new Vector2({ x: this.getX(), y: this.getY() });
      const offsetPoint = point.subtract(thisPos);
      if (child.intersects(offsetPoint)) {
        return true;
      }
    }
    return false;
  }
}


class CircleModel extends ShapeModel {
  constructor() {
    super();
    this._radius = this.defaultRadius();
  }

  defaultRadius() {
    return 10;
  }
  getRadius() {
    return this._radius;
  }
  setRadius(value) {
    this._radius = value;
  }

  intersects(point) {
    const x = processIndexValue(this, this.getX());
    const y = processIndexValue(this, this.getY());
    const thisCenter = new Vector2({ x, y });
    const distance = point.subtract(thisCenter).getLength();
    return distance <= this._radius;
  }
}


class RectangleModel extends ShapeModel {
  constructor() {
    super();

    this._width = this.defaultWidth();
    this._height = this.defaultHeight();
  }

  defaultWidth() {
    return 20;
  }
  getWidth() {
    return this._width;
  }
  setWidth(value) {
    this._width = value;
  }

  defaultHeight() {
    return 20;
  }
  getHeight() {
    return this._height;
  }
  setHeight(value) {
    this._height = value;
  }

  intersects(point) {
    const x = processIndexValue(this, this.getX());
    const y = processIndexValue(this, this.getY());

    const halfWidth = this.getWidth() / 2;
    const halfHeight = this.getHeight() / 2;

    const withinX = point.x >= x - halfWidth &&
      point.x <= (x + halfWidth);
    const withinY = point.y >= y - halfHeight &&
      point.y <= (y + halfHeight);
    return withinX && withinY;
  }
}


class TriangleModel extends ShapeModel {
  constructor() {
    super();

    this._x1 = this.defaultX1();
    this._y1 = this.defaultY1();
    this._x2 = this.defaultX2();
    this._y2 = this.defaultY2();
    this._x3 = this.defaultX3();
    this._y3 = this.defaultY3();

    this.updateRadius();
  }

  defaultX1() {
    return 0;
  }
  getX1() {
    return this._x1;
  }
  setX1(value) {
    this._x1 = value;
    this.updateRadius();
  }

  defaultY1() {
    return -10;
  }
  getY1() {
    return this._y1;
  }
  setY1(value) {
    this._y1 = value;
    this.updateRadius();
  }

  defaultX2() {
    return 10;
  }
  getX2() {
    return this._x2;
  }
  setX2(value) {
    this._x2 = value;
    this.updateRadius();
  }

  defaultY2() {
    return 5;
  }
  getY2() {
    return this._y2;
  }
  setY2(value) {
    this._y2 = value;
    this.updateRadius();
  }
  
  defaultX3() {
    return -10;
  }
  getX3() {
    return this._x3;
  }
  setX3(value) {
    this._x3 = value;
    this.updateRadius();
  }

  defaultY3() {
    return 5;
  }
  getY3() {
    return this._y3;
  }
  setY3(value) {
    this._y3 = value;
    this.updateRadius();
  }

  //defaultVertices() {
  //  return [
  //    new Vector2({ x: 0, y: -10 }),
  //    new Vector2({ x: 10, y: 5 }),
  //    new Vector2({ x: -10, y: 5 }),
  //  ];
  //}
  //getVertices() {
  //  return this._vertices;
  //}
  //setVertices(value) {
  //  this._vertices = value;
  //  this.updateRadius();
  //}

  updateRadius() {

    const thisCenter = new Vector2({ x: this.getX(), y: this.getY() });

    const vertices = [
      new Vector2({ x: this.getX1(), y: this.getY1() }),
      new Vector2({ x: this.getX2(), y: this.getY2() }),
      new Vector2({ x: this.getX3(), y: this.getY3() }),
    ];

    let max = 0;
    for (let vertex of vertices) {
      const len = vertex.getLength();
      
      if (len > max) {
        max = len;
      }
    }

    this._radius = max;
  }

  // TODO: implement a proper triangle intersection test
  intersects(point) {
    const x = processIndexValue(this, this.getX());
    const y = processIndexValue(this, this.getY());

    const thisCenter = new Vector2({ x, y });
    const distance = point.subtract(thisCenter).getLength();
    return distance <= this._radius;
  }
}


class LineModel extends ShapeModel {
  constructor() {
    super();

    this._x1 = this.defaultX1();
    this._y1 = this.defaultX1();
    this._x2 = this.defaultX2();
    this._y2 = this.defaultX2();

  }

  defaultX1() {
    return -10;
  }
  getX1() {
    return this._x1;
  }
  setX1(value) {
    this._x1 = value;
  }

  defaultY1() {
    return -10;
  }
  getY1() {
    return this._y1;
  }
  setY1(value) {
    this._y1 = value;
  }

  defaultX2() {
    return 10;
  }
  getX2() {
    return this._x2;
  }
  setX2(value) {
    this._x2 = value;
  }

  defaultY2() {
    return 10;
  }
  getY2() {
    return this._y2;
  }
  setY2(value) {
    this._y2 = value;
  }

  // TODO: implement a proper line intersection test
  intersects(point) {
    return false;
  }
}


module.exports = {
  processIndexValue,
  ANMLModel,
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  IndexOperationModel,
  UserDefinedShapeDefinitionModel,
  UserDefinedShapeModel,
  ShapeModel,
  GroupModel,
  ListModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
};
