const { Vector2 } = require('./math');
const {
  PointModel,
  CircleModel,
  RectangleModel,
  GroupModel,
  MultiLineModel,
} = require('./model');


class VisualEditor {
  constructor({ domElementId, renderer, panzoom }) {
    this.el = document.getElementById(domElementId);

    const clearButton = document.createElement('button');
    clearButton.innerHTML = "Move";
    clearButton.addEventListener('click', (e) => {
      this.setMode('move');
    });

    this.el.appendChild(clearButton);
    const circleButton = document.createElement('button');
    circleButton.innerHTML = "Circle";
    circleButton.addEventListener('click', (e) => {
      this.setMode('create-circle');
    });
    this.el.appendChild(circleButton);

    const rectButton = document.createElement('button');
    rectButton.innerHTML = "Rectangle";
    rectButton.addEventListener('click', (e) => {
      this.setMode('create-rectangle');
    });
    this.el.appendChild(rectButton);

    const wireButton = document.createElement('button');
    wireButton.innerHTML = "Wire";
    wireButton.addEventListener('click', (e) => {
      this.setMode('create-wire');
    });
    this.el.appendChild(wireButton);

    this.setMode('move');

    this.handleClick = this.handleNormalClick.bind(this);
    this.handleMouseMove = this.handleNormalMouseMove.bind(this);


    let dragObj = null;
    let dragOffset;
    renderer.onMouseDown((point) => {
      console.log(point);

      this.handleClick(point, this._model);

      if (this.getMode() !== 'move') {
        return;
      }

      let hitShape = false;

      console.log("checking");
      for (let shape of this._model.getObjects()) {
        if (shape instanceof PointModel) {
          continue;
        }

        const intersects = shape.intersects(point);

        if (intersects && shape.getName() !== 'box') {
          hitShape = true;

          //checkSwitches(shape);
          
          const objPos = new Vector2({ x: shape.getX(), y: shape.getY() });
          dragOffset = point.subtract(objPos);
          dragObj = shape;
          panzoom.disable();

          if (shape instanceof GroupModel) {

            const groupPos = objPos;
            const relativePoint = point.subtract(groupPos);

            for (let child of shape.getChildren()) {
              const childPos = new Vector2({ x: child.getX(), y: child.getY() });
              if (child.intersects(relativePoint)) {
                hitShape = true;
                console.log(child);
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
    });

    renderer.onMouseUp((point) => {
      dragObj = null;
      panzoom.enable();
    });

    renderer.onMouseMove((point) => {

      this.handleMouseMove(point);

      if (this.getMode() !== 'move') {
        return;
      }

      if (dragObj !== null) {
        dragObj.setX(point.x - dragOffset.x);
        dragObj.setY(point.y - dragOffset.y);
        if (this._onChangeCallback) {
          this._onChangeCallback();
        }
      }
    });

    renderer.onContextMenu(() => {
      this.setMode('move');
    });
  }

  getMode() {
    return this._mode;
  }
  setMode(value) {
    this._mode = value;
  }

  handleNormalClick(point, model) {
    switch(this.getMode()) {
      case 'create-circle':
        const c = new CircleModel();
        c.setX(point.x);
        c.setY(point.y);
        model.add(c);
        break;
      case 'create-rectangle':
        const r = new RectangleModel();
        r.setX(point.x);
        r.setY(point.y);
        model.add(r);
        break;
      case 'create-wire':
        const w = new MultiLineModel();
        w.setX(point.x);
        w.setY(point.y);
        model.add(w);
        const startPoint = new PointModel();
        startPoint.setX(point.x);
        startPoint.setY(point.y);
        w.appendPoint(startPoint);

        const nextPoint = new PointModel();
        nextPoint.setX(point.x);
        nextPoint.setY(point.y);
        w.appendPoint(nextPoint);
        this.wire = w;
        this.handleClick = this.handleWireClick.bind(this);
        this.handleMouseMove = this.handleWireMouseMove.bind(this);
        console.log(w);
        break;
      case 'move':
        break;
      default:
        throw "Invalid mode";
        break;
    }
  }

  handleNormalMouseMove(point) {
  }

  handleWireClick(point, model) {
    const newPoint = new PointModel();
    newPoint.setX(point.x);
    newPoint.setY(point.y);
    this.wire.appendPoint(newPoint);
  }

  handleWireMouseMove(point) {
    console.log(point);
    const points = this.wire.getPoints();
    const lastPoint = points[points.length - 1];
    lastPoint.setX(point.x);
    lastPoint.setY(point.y);

    if (this._onChangeCallback) {
      this._onChangeCallback();
    }
  }

  update(model) {
    this._model = model;
  }

  onChange(callback) {
    this._onChangeCallback = callback;
  }
}

module.exports = {
  VisualEditor,
};
