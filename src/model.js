const { Vector2 } = require('./math');


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
  ShapeModel,
  CircleModel,
  RectangleModel,
};
