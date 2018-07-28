const { Vector2 } = require('./math');
const {
  DataValueModel,
  DataTernaryModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
  SymbolModel,
} = require('./model');
const { getDataByPath } = require('./utils');


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

      if (this.onMouseDownCallback !== undefined) {
        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getViewportCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);
        worldPoint.y = -worldPoint.y;

        this.onMouseDownCallback(worldPoint);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {

      if (this.onMouseUpCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getViewportCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);
        worldPoint.y = -worldPoint.y;
        this.onMouseUpCallback(worldPoint);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {

      if (this.onMouseMoveCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getViewportCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);
        worldPoint.y = -worldPoint.y;
        this.onMouseMoveCallback(worldPoint);
      }
    });


    this.setViewportCenter({ x: 0, y: 0 });
  }

  getViewportCenter() {
    return new Vector2({
      x: this._viewPortCenterX,
      y: this._viewPortCenterY,
    });
  }
  setViewportCenter({ x, y }) {
    this._viewPortCenterX = x + (this.canvas.width / 2);
    this._viewPortCenterY = y + (this.canvas.height / 2 );
  }

  render(model) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    //const viewPortOffset = new Vector2({
    //  x: this._viewPortCenterX,
    //  y: this._viewPortCenterY
    //});

    for (let shape of model.getShapes()) {
      //this.renderShape(shape, viewPortOffset);  
      this.renderShape(shape);  
    }
  }

  processAttr(shape, attr, data) {
    if (attr instanceof DataValueModel) {
      const path = [shape.getDataKey()].concat(attr.getPath());
      return getDataByPath(data, attr.getPath());
    }
    else if (attr instanceof DataTernaryModel) {
      const path = attr.getPath();
      const val = getDataByPath(data, path);

      switch(attr.getCondition()) {
        case '==':
          if (val === attr.getCheckValue()) {
            return attr.getTrueValue();
          }
          else {
            return attr.getFalseValue();
          }
          break;
        default:
          throw "Invalid condition: " + attr.getCondition();
          break;
      }
    }
    else {
      return attr;
    }
  }

  renderShape(shape, offsetVec, parentData) {

    let data;
    if (parentData === undefined) {
      data = shape.getData();
    }
    else {
      const dataKey = shape.getDataKey();
      if (dataKey !== undefined) {
        data = parentData[dataKey];
      }
      else {
        data = parentData;
      }
    }

    const saveStroke = this.ctx.strokeStyle;
    const strokeColor = shape.getStrokeColor();
    this.ctx.strokeStyle = this.processAttr(shape, strokeColor, data);

    const saveFill = this.ctx.fillStyle;
    const fillColor = shape.getFillColor();
    this.ctx.fillStyle = this.processAttr(shape, fillColor, data);;

    const savedLineWidth = this.ctx.lineWidth;
    this.ctx.lineWidth = shape.getStrokeWidth();

    if (shape instanceof CircleModel) {
      this.drawCircle(shape, offsetVec);
    }
    else if (shape instanceof RectangleModel) {
      this.drawRectangle(shape, offsetVec);
    }
    else if (shape instanceof TriangleModel) {
      this.drawTriangle(shape, offsetVec);
    }
    else if (shape instanceof LineModel) {
      this.drawLine(shape, offsetVec);
    }
    else if (shape instanceof SymbolModel) {
      this.drawSymbol(shape, offsetVec, data);
    }

    this.ctx.strokeStyle = saveStroke;
    this.ctx.fillStyle = saveFill;
    this.ctx.lineWidth = savedLineWidth;
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

  drawGrid() {
    const savedLineWidth = this.ctx.lineWidth;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this._viewPortCenterX + 0.5, 0.5);
    this.ctx.lineTo(this._viewPortCenterX + 0.5, this.canvas.height + 0.5);
    this.ctx.moveTo(0.5, this._viewPortCenterY + 0.5);
    this.ctx.lineTo(this.canvas.width + 0.5, this._viewPortCenterY + 0.5);
    this.ctx.stroke();
    this.ctx.lineWidth = savedLineWidth;
  }

  drawCircle(c, offsetVec) {

    let x = c.getX();
    let y = c.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    this.ctx.beginPath();
    this.ctx.arc(this._x(x), this._y(y), c.getRadius(), 0, 2*Math.PI); 
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
    const halfWidth = r.getWidth() / 2;
    const halfHeight = r.getHeight() / 2;
    this.ctx.rect(
      this._x(x - halfWidth),
      this._y(y - halfHeight), r.getWidth(), -r.getHeight());
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawTriangle(t, offsetVec) {
    let x = t.getX();
    let y = t.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this._x(x + t.getX1()), this._y(y + t.getY1()));
    this.ctx.lineTo(this._x(x + t.getX2()), this._y(y + t.getY2()));
    this.ctx.lineTo(this._x(x + t.getX3()), this._y(y + t.getY3()));
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawLine(l, offsetVec) {

    let x = l.getX();
    let y = l.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    this.ctx.beginPath();
    this.ctx.moveTo(this._x(x + l.getX1()), this._y(y + l.getY1()));
    this.ctx.lineTo(this._x(x + l.getX2()), this._y(y + l.getY2()));
    //this.ctx.fill();
    this.ctx.stroke();
  }

  drawSymbol(s, offsetVec, data) {
    const thisPos = new Vector2({ x: s.getX(), y: s.getY() });
    let cumulativeOffset = thisPos;
    if (offsetVec !== undefined) {
      cumulativeOffset = thisPos.add(offsetVec);
    }

    for (let child of s.getChildren()) {
      this.renderShape(child, cumulativeOffset, data);
    }
  }

  _x(x) {
    return this._viewPortCenterX + x;
  }

  _y(y) {
    return this._viewPortCenterY - y;
  }
}


module.exports = {
  ANMLRenderer,
};
