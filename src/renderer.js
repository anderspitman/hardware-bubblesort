const { Vector2 } = require('./math');
const {
  CircleModel,
  RectangleModel,
  SymbolModel,
} = require('./model');


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
      this.renderShape(shape);  
    }
  }

  renderShape(shape, offsetVec) {
    if (shape instanceof CircleModel) {
      this.drawCircle(shape, offsetVec);
    }
    else if (shape instanceof RectangleModel) {
      this.drawRectangle(shape, offsetVec);
    }
    else if (shape instanceof SymbolModel) {
      this.drawSymbol(shape, offsetVec);
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

  drawCircle(c, offsetVec) {

    let x = c.getX();
    let y = c.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    this.ctx.beginPath();
    this.ctx.arc(x, y, c.getRadius(), 0, 2*Math.PI); 
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawRectangle(r, offsetVec) {
    let x = r.getX();
    let y = r.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    this.ctx.beginPath();
    this.ctx.rect(x, y, r.getWidth(), r.getHeight());
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawSymbol(s) {
    const offsetVec = new Vector2({ x: s.getX(), y: s.getY() });
    for (let child of s.getChildren()) {
      this.renderShape(child, offsetVec);    
    }
  }
}


module.exports = {
  ANMLRenderer,
};
