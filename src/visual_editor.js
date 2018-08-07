const { Vector2 } = require('./math');
const { CircleModel, RectangleModel, GroupModel } = require('./model');


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

    this.setMode('move');





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
      for (let shape of this._model.getShapes()) {
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
  }

  getMode() {
    return this._mode;
  }
  setMode(value) {
    this._mode = value;
  }

  handleClick(point, model) {
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
      case 'move':
        break;
      default:
        throw "Invalid mode";
        break;
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
