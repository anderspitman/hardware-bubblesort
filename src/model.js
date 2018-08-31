const { Vector2 } = require('./math');
const { getDataByPath } = require('./utils');

function processMagicValue(shape, value) {
  if (value instanceof IndexOperationModel) {
    switch(value.getOperator()) {
      case '*':
        const val = shape.getListIndex() * value.getFactor();
        return val;
        break;
      default:
        throw "Invalid operator";
        break;
    }
  }
  else if (value instanceof DataValueModel) {
    return getDataByPath(shape.getData(), value.getPath());
  }
  else if (value.constructor === ConstantDefinitionModel) {
    return value.getValue();
  }
  else {
    return value;
  }
}

class ANMLModel {
  constructor() {
    this._objects = [];
    this._listeners = [];
  }

  addUpdateListener(callback) {
    this._listeners.push(callback);
  }

  notifyUpdate() {
    for (let cb of this._listeners) {
      cb(this);
    }
  }

  add(shape) {
    this._objects.push(shape);
    this.notifyUpdate();
  }

  remove(obj) {
    for (let i = 0; i < this._objects.length; i++) {
      if (this._objects[i] === obj) {
        this._objects.splice(i, 1);
        this.notifyUpdate();
        break;
      }
    }
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

  getObjects() {
    return this._objects;
  }
  setObjects(value) {
    this._objects = value;
  }

  update(data) {
    for (let shape of this.getObjects()) {

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


class ObjectModel {
  constructor() {
    this._data = this.defaultData();
    this._x = this.defaultX();
    this._y = this.defaultY();
    this.setShow(this.defaultShow());
    this._parent = null;
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

  defaultShow() {
    return true;
  }
  getShow() {
    return this._show;
  }
  setShow(value) {
    this._show = value;
  }

  intersects(point) {
    return false;
  }

  intersectsGlobal(point) {
    let parent = this._parent;
    // compensate for ancestor offsets to determine the equivalent point in
    // local (model) space.
    const localPoint = new Vector2({ x: point.x, y: point.y });
    while (parent !== null) {
      localPoint.x -= processMagicValue(parent, parent.getX());
      localPoint.y -= processMagicValue(parent, parent.getY());
      parent = parent._parent;
    }

    return this.intersects(localPoint);
  }
}


class PointModel extends ObjectModel {
  constructor() {
    super();
  }

  defaultShow() {
    return false;
  }

  intersects(point) {
    const x = processMagicValue(this, this.getX());
    const y = processMagicValue(this, this.getY());
    const radius = 10;
    const thisCenter = new Vector2({ x, y });
    const distance = point.subtract(thisCenter).getLength();
    return distance <= radius;
  }
}


class ShapeModel extends ObjectModel {

  constructor() {
    super();
    this._strokeWidth = this.defaultStrokeWidth();
    this._strokeColor = this.defaultStrokeColor();
    this._fillColor = this.defaultFillColor();
  }

  defaultStrokeWidth() {
    return 3;
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
    setChildren.bind(this)(value);
  }

  intersects(point) {
    for (let child of this.getChildren()) {

      const x = processMagicValue(this, this.getX());
      const y = processMagicValue(this, this.getY());

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
    setChildren.bind(this)(value);
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
    setChildren.bind(this)(value);
  }

  intersects(point) {
    const x = processMagicValue(this, this.getX());
    const y = processMagicValue(this, this.getY());
    const thisPos = new Vector2({ x, y });

    for (let child of this.getChildren()) {

      const offsetPoint = point.subtract(thisPos);
      if (child.intersects(offsetPoint)) {
        return true;
      }
    }
    return false;
  }
}


class ArcModel extends ShapeModel {
  constructor() {
    super();
    this.setRadius(this.defaultRadius());
    this.setStartAngle(this.defaultStartAngle());
    this.setEndAngle(this.defaultEndAngle());
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

  defaultStartAngle() {
    return 0;
  }
  getStartAngle() {
    return this._startAngle;
  }
  setStartAngle(value) {
    this._startAngle = value;
  }

  defaultEndAngle() {
    return Math.PI;
  }
  getEndAngle() {
    return this._endAngle;
  }
  setEndAngle(value) {
    this._endAngle = value;
  }

  // TODO handle actual arc intersection. This is just using a circle.
  intersects(point) {
    const x = processMagicValue(this, this.getX());
    const y = processMagicValue(this, this.getY());
    const radius = processMagicValue(this, this.getRadius());
    const thisCenter = new Vector2({ x, y });
    const distance = point.subtract(thisCenter).getLength();
    return distance <= radius;
  }
}


class CircleModel extends ArcModel {
  getStartAngle() {
    return 0;
  }
  getEndAngle() {
    return Math.PI * 2;
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
    const x = processMagicValue(this, this.getX());
    const y = processMagicValue(this, this.getY());

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
    const x = processMagicValue(this, this.getX());
    const y = processMagicValue(this, this.getY());

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


class MultiLineModel extends ShapeModel {
  constructor() {
    super();

    this.setPoints(this.defaultPoints());
  }

  defaultPoints() {
    return [];
  }
  getPoints() {
    return this._points;
  }
  setPoints(value) {
    this._points = value;
  }

  getLastPoint() {
    const points = this.getPoints();
    const lastPoint = points[points.length - 1];
    return lastPoint;
  }

  appendPoint(point) {
    this._points.push(point);
  }

  intersects(point) {
    return false;
  }

  intersectsLastPoint(point) {
    const offsetX = point.x - this.getX();
    const offsetY = point.y - this.getY();

    const lastPoint = this.getLastPoint();

    return lastPoint.intersects(new Vector2({ x: offsetX, y: offsetY }));
  }

  intersectsPoint(point) {
    const offsetX = point.x - this.getX();
    const offsetY = point.y - this.getY();

    for (let point of this.getPoints()) {
      if (point.intersects(new Vector2({ x: offsetX, y: offsetY }))) {
        return point;
      }
    }

    return null;
  }

  intersectsLine(point) {

    const points = this.getPoints();

    if (points.length < 2) {
      return null;
    }

    for (let i = 0; i < points.length - 1; i++) {
      const line = {
        start: points[i],
        end: points[i+1],
      };

      if (this._isHorizontal(line)) {
        line.type = 'horizontal';
        const rw = Math.abs(line.end.getX() - line.start.getX());
        const rh = processMagicValue(this, this.getStrokeWidth());
        const rx = (line.start.getX() + line.end.getX()) / 2;
        const ry = line.start.getY();
        if (pointIntersectsRectangle(point.x, point.y, rx, ry, rw, rh)) {
          console.log(rh);
          return line;
        }
      }
      else if (this._isVertical(line)) {
        line.type = 'vertical';
        const rw = processMagicValue(this, this.getStrokeWidth());
        const rh = Math.abs(line.end.getY() - line.start.getY());
        const rx = line.start.getX();
        const ry = (line.start.getY() + line.end.getY()) / 2;
        if (pointIntersectsRectangle(point.x, point.y, rx, ry, rw, rh)) {
          return line;
        }
      }
    }

    return null;
  }

  _isHorizontal(line) {
    return line.start.getY() === line.end.getY();
  }

  _isVertical(line) {
    return line.start.getX() === line.end.getX();
  }
}

function pointIntersectsRectangle(px, py, rx, ry, width, height) {
  const x = rx;
  const y = ry;

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const withinX = px >= x - halfWidth &&
    px <= (x + halfWidth);
  const withinY = py >= y - halfHeight &&
    py <= (y + halfHeight);
  return withinX && withinY;
}


class TextModel extends ShapeModel {
  constructor() {
    super();
    this.setFontFamily(this.defaultFontFamily());
    this.setFontSize(this.defaultFontSize());
    this.setFontWeight(this.defaultFontWeight());
    this.setText(this.defaultText());
  }

  defaultFontFamily() {
    return 'Courier New';
  }
  getFontFamily() {
    return this._fontFamily;
  }
  setFontFamily(value) {
    this._fontFamily = value;
  }

  defaultFontSize() {
    return 16;
  }
  getFontSize() {
    return this._fontSize;
  }
  setFontSize(value) {
    this._fontSize = value;
  }

  defaultFontWeight() {
    return 'normal';
  }
  getFontWeight() {
    return this._fontWeight;
  }
  setFontWeight(value) {
    this._fontWeight = value;
  }

  defaultText() {
    return "Hi there";
  }
  getText() {
    return this._text;
  }
  setText(value) {
    this._text = value;
  }
}

function setChildren(children) {
  for (let child of children) {
    child._parent = this;
  }
  this._children = children;
}


module.exports = {
  processMagicValue,
  ANMLModel,
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  IndexOperationModel,
  UserDefinedShapeDefinitionModel,
  UserDefinedShapeModel,
  ObjectModel,
  PointModel,
  ShapeModel,
  GroupModel,
  ListModel,
  ArcModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
  MultiLineModel,
  TextModel,
};
