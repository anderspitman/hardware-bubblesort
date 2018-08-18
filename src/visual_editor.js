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
    this.panzoom = panzoom;
    this.dragObj = null;
    this.dragOffset = null;
    this.dragLineHoriz = null;
    this.dragLineVert = null;
    this.moveLineHoriz = null;
    this.moveLineVert = null;
    this.movePoint = null;
    this.moveStartPoint = null;
  }
  stop() {
    this.panzoom = null;
    this.dragObj = null;
    this.dragOffset = null;
    this.dragLineHoriz = null;
    this.dragLineVert = null;
    this.moveLineVert = null;
    this.movePoint = null;
    this.moveStartPoint = null;
  }

  mouseDown(point, model, objClickCallback) {

    let hitShape = false;

    for (let shape of model.getObjects()) {
      if (shape.constructor === MultiLineModel) {

        const line = shape.intersectsLine(point);
        if (line) {
          if (line.type === 'horizontal') {
            this.moveLineHoriz = line;
          }
          else if (line.type === 'vertical') {
            this.moveLineVert = line;
          }
          this.dragOffset = new Vector2({ x: 0, y: 0 });
          this.panzoom.disable();
          hitShape = true;
        }

        const hitPoint = shape.intersectsPoint(point);
        if (hitPoint !== null) {
          hitShape = true;
          this.movePoint = hitPoint;
          this.moveStartPoint = new Vector2({
            x: hitPoint.getX(),
            y: hitPoint.getY()
          });
          this.panzoom.disable();
          break;
        }
      }
      else {

        const intersects = shape.intersects(point);

        if (intersects) {
          this.panzoom.disable();
          hitShape = true;

          objClickCallback(shape);
          
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
                objClickCallback(child);
                break;
              }
            }
          }

          break;
        }
      }
    }

    if (!hitShape) {
      this.panzoom.enable();
    }

  }

  mouseUp(point) {
    this.dragObj = null;
    this.dragLineHoriz = null;
    this.dragLineVert = null;
    this.moveLineHoriz = null;
    this.moveLineVert = null;
    this.movePoint = null;
    this.moveStartPoint = null;
    //this.panzoom.enable();
  }

  mouseMove(point, model, inputHandler) {

    let changed = false;

    if (this.dragObj !== null && this.dragOffset !== null) {
      this.dragObj.setX(point.x - this.dragOffset.x);
      this.dragObj.setY(point.y - this.dragOffset.y);
      changed = true;
    }

    if (this.dragLineHoriz !== null && this.dragOffset !== null) {
      for (let vertex of this.dragLineHoriz) {
        vertex.setX(point.x - this.dragOffset.x);
      }
      changed = true;
    }

    if (this.movePoint !== null && this.moveStartPoint !== null) {
      if (inputHandler.getKeyState('shift')) {
        const xDiff = Math.abs(point.x - this.moveStartPoint.x);
        const yDiff = Math.abs(point.y - this.moveStartPoint.y);

        if (xDiff > yDiff) {
          // only move along x
          console.log("x");
          this.movePoint.setX(point.x);
          this.movePoint.setY(this.moveStartPoint.y);
        }
        else {
          // only move along y
          console.log("y");
          this.movePoint.setX(this.moveStartPoint.x);
          this.movePoint.setY(point.y);
        }
      }
      else {
        this.movePoint.setX(point.x);
        this.movePoint.setY(point.y);
      }
      changed = true;
    }

    if (this.moveLineHoriz !== null && this.dragOffset !== null) {
      this.moveLineHoriz.start.setY(point.y - this.dragOffset.y);
      this.moveLineHoriz.end.setY(point.y - this.dragOffset.y);
      changed = true;
    }

    if (this.moveLineVert !== null && this.dragOffset !== null) {
      this.moveLineVert.start.setX(point.x - this.dragOffset.x);
      this.moveLineVert.end.setX(point.x - this.dragOffset.x);
      changed = true;
    }

    if (this.dragLineVert !== null && this.dragOffset !== null) {
      for (let vertex of this.dragLineVert) {
        vertex.setY(point.y - this.dragOffset.y);
      }
      changed = true;
    }

    for (let obj of model.getObjects()) {
      if (obj.constructor === MultiLineModel) {
        for (let linePoint of obj.getPoints()) {
          if (linePoint.intersects(point)) {
            linePoint.setShow(true);
          }
          else {
            linePoint.setShow(false);
          }
          changed = true;
        }
      }
    }

    if (changed) {
      model.notifyUpdate();
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


class MultiLineHander extends Handler {

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


class WireHander extends Handler {

  start() {
    this.w = null;
  }

  mouseDown(point, model) {
    if (this.w === null) {
      this.w = new MultiLineModel();
      const startPoint = new PointModel();
      startPoint.setX(point.x);
      startPoint.setY(point.y);
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

    if (this.w === null) {
      return;
    }

    const points = this.w.getPoints();
    const x = this.w.getX();
    const y = this.w.getY();

    const offsetX = point.x - x;
    const offsetY = point.y - y;

    const lastPoint = points[points.length - 2];
    const newPoint = points[points.length - 1];

    const lastX = lastPoint.getX();
    const lastY = lastPoint.getY();

    const xDiff = Math.abs(offsetX - lastX);
    const yDiff = Math.abs(offsetY - lastY);

    if (xDiff > yDiff) {
      // make a horizontal line
      newPoint.setX(offsetX);
      newPoint.setY(lastY);
    }
    else {
      // make a vertical line
      newPoint.setX(lastX);
      newPoint.setY(offsetY);
    }

    model.notifyUpdate();
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
      changeHandler(wireHandler);
    });
    this.el.appendChild(wireButton);

    const changeHandler = (newHandler) => {
      handler.stop(this._model);
      newHandler.start(this._model, panzoom);
      handler = newHandler;
    };

    const wireHandler = new WireHander();
    const circleHandler = new CreateCircleHandler();
    const rectangleHandler = new CreateRectangleHandler();

    const moveHandler = new MoveHandler();

    let handler = moveHandler;
    changeHandler(moveHandler);


    inputHandler.onMouseDown((clickPoint) => {
      const point = renderer.toWorldCoordinates(clickPoint);
      handler.mouseDown(point, this._model, (obj) => {
        if (this._onObjClick !== undefined) {
          this._onObjClick(obj);
        }
      });
    });

    inputHandler.onMouseUp((clickPoint) => {
      const point = renderer.toWorldCoordinates(clickPoint);
      handler.mouseUp(point);
    });

    inputHandler.onMouseMove((clickPoint) => {

      const point = renderer.toWorldCoordinates(clickPoint);

      handler.mouseMove(point, this._model, inputHandler);

    });
  }

  onObjClick(callback) {
    this._onObjClick = callback;
  }

  update(model) {
    this._model = model;
  }
}

module.exports = {
  VisualEditor,
};
