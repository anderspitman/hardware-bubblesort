const { Vector2 } = require('./math');
const {
  PointModel,
  CircleModel,
  RectangleModel,
  GroupModel,
  MultiLineModel,
} = require('./model');


class Handler {
  mouseDown() {
  }
  mouseUp() {
  }
  mouseMove() {
  }
  start() {
  }
  stop() {
  }
}


class MoveHandler extends Handler {

  start(model, panzoom) {
    this.model = model;
    this.panzoom = panzoom;
    this.dragObj = null;
    this.dragOffset = null;
  }
  stop() {
    this.model = null;
    this.panzoom = null;
    this.dragObj = null;
    this.dragOffset = null;
  }

  mouseDown(point) {

    let hitShape = false;

    for (let shape of this.model.getObjects()) {
      if (shape instanceof PointModel) {
        continue;
      }

      const intersects = shape.intersects(point);

      if (intersects && shape.getName() !== 'box') {
        hitShape = true;

        //checkSwitches(shape);
        
        const objPos = new Vector2({ x: shape.getX(), y: shape.getY() });
        this.dragOffset = point.subtract(objPos);
        this.dragObj = shape;
        this.panzoom.disable();

        if (shape instanceof GroupModel) {

          const groupPos = objPos;
          const relativePoint = point.subtract(groupPos);

          for (let child of shape.getChildren()) {
            const childPos = new Vector2({ x: child.getX(), y: child.getY() });
            if (child.intersects(relativePoint)) {
              hitShape = true;
              checkSwitches(child);
              break;
            }
          }
        }

        break;
      }
    }

    if (!hitShape) {
      console.log("hit canvas");
    }

  }

  mouseUp(point) {
    this.dragObj = null;
    this.panzoom.enable();
  }

  mouseMove(point) {
    if (this.dragObj !== null && this.dragOffset !== null) {
      this.dragObj.setX(point.x - this.dragOffset.x);
      this.dragObj.setY(point.y - this.dragOffset.y);
      this.model.notifyUpdate();
    }
  }
}


class BasicShapeHandler extends Handler {
  start(model) {
    this.s = new this.Con();
    this.s.setX(1000);
    this.s.setY(1000);
    model.add(this.s);
    this.model = model;
  }

  mouseDown(point, model) {
    this.s = new this.Con();
    this.s.setX(point.x);
    this.s.setY(point.y);
    model.add(this.s);
  }

  mouseMove(point) {
    this.s.setX(point.x);
    this.s.setY(point.y);
    this.model.notifyUpdate();
  }

  stop() {
    this.model.remove(this.s);
    this.s = null;
  }
}


class CreateCircleHandler extends BasicShapeHandler {
  constructor() {
    super();
    this.Con = CircleModel;
  }
}


class CreateRectangleHandler extends BasicShapeHandler {
  constructor() {
    super();
    this.Con = RectangleModel;
  }
}


class WireHander extends Handler {

  start() {
    this.w = null;
  }

  mouseDown(point, model) {
    if (this.w === null) {
      this.w = new MultiLineModel();
      this.w.setX(point.x);
      this.w.setY(point.y);
      const startPoint = new PointModel();
      this.w.appendPoint(startPoint);
      model.add(this.w);
    }

    const x = this.w.getX();
    const y = this.w.getY();
    const nextPoint = new PointModel();
    nextPoint.setX(point.x - x);
    nextPoint.setY(point.y - y);
    this.w.appendPoint(nextPoint);
    model.notifyUpdate();
  }

  mouseMove(point, model) {

    if (this.w !== null) {
      const points = this.w.getPoints();
      const x = this.w.getX();
      const y = this.w.getY();
      const lastPoint = points[points.length - 1];
      lastPoint.setX(point.x - x);
      lastPoint.setY(point.y - y);

      model.notifyUpdate();
    }
  }

  stop(model) {
    const points = this.w.getPoints();
    // remove the last point
    points.splice(points.length - 1, 1);
    model.notifyUpdate();
    this.w = null;
  }
}


class VisualEditor {
  constructor({ domElementId, renderer, panzoom, inputHandler }) {
    this.el = document.getElementById(domElementId);

    const clearButton = document.createElement('button');
    clearButton.innerHTML = "Move";
    clearButton.addEventListener('click', (e) => {
      changeHandler(moveHandler);
    });

    this.el.appendChild(clearButton);
    const circleButton = document.createElement('button');
    circleButton.innerHTML = "Circle";
    circleButton.addEventListener('click', (e) => {
      changeHandler(circleHandler);
    });
    this.el.appendChild(circleButton);

    const rectButton = document.createElement('button');
    rectButton.innerHTML = "Rectangle";
    rectButton.addEventListener('click', (e) => {
      changeHandler(rectangleHandler);
    });
    this.el.appendChild(rectButton);

    const wireButton = document.createElement('button');
    wireButton.innerHTML = "Wire";
    wireButton.addEventListener('click', (e) => {
      changeHandler(createWireHandler);
    });
    this.el.appendChild(wireButton);

    const changeHandler = (newHandler) => {
      handler.stop(this._model);
      newHandler.start(this._model, panzoom);
      handler = newHandler;
    };

    const createWireHandler = new WireHander();
    const circleHandler = new CreateCircleHandler();
    const rectangleHandler = new CreateRectangleHandler();

    const moveHandler = new MoveHandler();

    let handler = moveHandler;
    changeHandler(moveHandler);


    inputHandler.onMouseDown((clickPoint) => {
      const point = renderer.toWorldCoordinates(clickPoint);
      handler.mouseDown(point, this._model);

    });

    inputHandler.onMouseUp((clickPoint) => {
      const point = renderer.toWorldCoordinates(clickPoint);
      handler.mouseUp(point);
    });

    inputHandler.onMouseMove((clickPoint) => {

      const point = renderer.toWorldCoordinates(clickPoint);

      handler.mouseMove(point, this._model);

    });
  }

  update(model) {
    this._model = model;
  }
}

module.exports = {
  VisualEditor,
};
