const { Vector2 } = require('./math');
const { CircleModel } = require('./model');


class ANMLRenderer {
  constructor({ domParentId }) {
    this.parent = document.getElementById(domParentId);
    const dim = this.parent.getBoundingClientRect();

    this.canvas = document.createElement('canvas');
    this.canvas.width = dim.width;
    this.canvas.height = dim.height;
    this.canvas.style.width = dim.width;
    this.canvas.style.height = dim.height;
    this.parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('mousedown', (e) => {
      const clickPoint = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseDownCallback !== undefined) {
        this.onMouseDownCallback(clickPoint);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      const point = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseUpCallback !== undefined) {
        this.onMouseUpCallback(point);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const point = new Vector2({
        x: e.clientX,
        y: e.clientY,
      });

      if (this.onMouseMoveCallback !== undefined) {
        this.onMouseMoveCallback(point);
      }
    });
  }

  render(model) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let shape of model.getShapes()) {
      if (shape instanceof CircleModel) {
        this.drawCircle(shape);
      }
    }
  }

  onMouseDown(callback) {
    this.onMouseDownCallback = callback;
  }

  onMouseUp(callback) {
    this.onMouseUpCallback = callback;
  }

  onMouseMove(callback) {
    this.onMouseMoveCallback = callback;
  }

  drawCircle(c) {
    this.ctx.beginPath();
    this.ctx.arc(c.getX(), c.getY(), c.getRadius(), 0, 2*Math.PI); 
    this.ctx.fill();
    this.ctx.stroke();
  }
}


module.exports = {
  ANMLRenderer,
};
