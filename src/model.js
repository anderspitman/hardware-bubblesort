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
    const withinX = point.x >= this.getX() &&
      point.x <= (this.getX() + this.getWidth());
    const withinY = point.y >= this.getY() &&
      point.y <= (this.getY() + this.getHeight());
    return withinX && withinY;
  }
}


module.exports = {
  ANMLModel,
  SymbolDefinitionModel,
  SymbolModel,
  ShapeModel,
  CircleModel,
  RectangleModel,
};
