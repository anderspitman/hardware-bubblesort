const { Vector2 } = require('./math');


class ANMLModel {
  constructor() {
    this._shapes = [];
  }

  add(shape) {
    this._shapes.push(shape);
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
}


class SymbolDefinitionModel {
  getName() {
    return this._name;
  }
  setName(value) {
    this._name = value;
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
    this._x = 0;
    this._y = 0;
    this._strokeWidth = this.defaultStrokeWidth();
  }

  getName() {
    return this._name;
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

  defaultStrokeWidth() {
    return 1;
  }
  getStrokeWidth() {
    return this._strokeWidth;
  }
  setStrokeWidth(value) {
    this._strokeWidth = value;
  }
}


class SymbolModel extends ShapeModel {

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


class RectangleModel extends ShapeModel {
  constructor() {
    super();

    this._width = 10;
    this._height = 10;
  }

  getWidth() {
    return this._width;
  }
  setWidth(value) {
    this._width = value;
  }

  getHeight() {
    return this._height;
  }
  setHeight(value) {
    this._height = value;
  }

  intersects(point) {
    const halfWidth = this.getWidth() / 2;
    const halfHeight = this.getHeight() / 2;

    const withinX = point.x >= this.getX() - halfWidth &&
      point.x <= (this.getX() + halfWidth);
    const withinY = point.y >= this.getY() - halfHeight &&
      point.y <= (this.getY() + halfHeight);
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
    const thisCenter = new Vector2({ x: this.getX(), y: this.getY() });
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
  ANMLModel,
  SymbolDefinitionModel,
  SymbolModel,
  ShapeModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
};
