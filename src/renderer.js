const { Vector2 } = require('./math');
const {
  processIndexValue,
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  IndexOperationModel,
  GroupModel,
  ListModel,
  CircleModel,
  RectangleModel,
  TriangleModel,
  LineModel,
  UserDefinedShapeModel,
} = require('./model');
const { getDataByPath } = require('./utils');
const _ = require('lodash');


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
    this._scale = 1.0;

    const SCALE_MULTIPLIER = 1.10;
    const SCALE_MIN = 0.001;
    const SCALE_MAX = 1000;

    this.canvas.addEventListener('wheel', (e) => {
      console.log(e.deltaX, e.deltaY);
      if (e.deltaY > 0) {
        this._scale /= SCALE_MULTIPLIER;
        if (this._scale < SCALE_MIN) {
          this._scale = SCALE_MIN;
        }
      }
      else {
        this._scale *= SCALE_MULTIPLIER;
        if (this._scale > SCALE_MAX) {
          this._scale = SCALE_MAX;
        }
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {

      if (this.onMouseDownCallback !== undefined) {
        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getActualCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);
        worldPoint.y = -worldPoint.y;

        worldPoint.x /= this._scale;
        worldPoint.y /= this._scale;

        this.onMouseDownCallback(worldPoint);
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {

      if (this.onMouseUpCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getActualCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);

        worldPoint.y = -worldPoint.y;
        worldPoint.x /= this._scale;
        worldPoint.y /= this._scale;

        this.onMouseUpCallback(worldPoint);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {

      if (this.onMouseMoveCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        const worldOrigin = this.getActualCenter();
        const worldPoint = clickPoint.subtract(worldOrigin);
        worldPoint.y = -worldPoint.y;
        worldPoint.x /= this._scale;
        worldPoint.y /= this._scale;
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

  getActualCenter() {
    return new Vector2({
      x: this._actualCenterX,
      y: this._actualCenterY,
    });
  }

  setViewportCenter({ x, y }) {
    this._viewPortCenterX = x;
    this._viewPortCenterY = y;
    // TODO: no idea why this needs to be negative
    x = -x * this._scale;
    y = y * this._scale;
    this._actualCenterX = x + (this.canvas.width / 2);
    this._actualCenterY = y + (this.canvas.height / 2 );
  }

  render(model) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    //const viewPortOffset = new Vector2({
    //  x: this._actualCenterX,
    //  y: this._actualCenterY
    //});

    for (let shape of model.getShapes()) {
      //this.renderShape(shape, viewPortOffset);  
      this.renderShape(shape);  
    }
  }

  processAttr(shape, attr, data) {
    if (attr instanceof ConstantDefinitionModel) {
      return attr.getValue();
    }
    else if (attr instanceof DataValueModel) {
      const path = [shape.getDataKey()].concat(attr.getPath());
      return getDataByPath(data, attr.getPath());
    }
    else if (attr instanceof DataTernaryModel) {
      const path = attr.getPath();
      const val = getDataByPath(data, path);

      switch(attr.getCondition()) {
        case '==':
          if (val === attr.getCheckValue()) {
            return this._symbolOrValue(attr.getTrueValue());
          }
          else {
            return this._symbolOrValue(attr.getFalseValue());
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

  _symbolOrValue(ident) {
    if (ident instanceof ConstantDefinitionModel) {
      return ident.getValue();
    }
    else {
      return ident;
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
    this.ctx.fillStyle = this.processAttr(shape, fillColor, data);

    const savedLineWidth = this.ctx.lineWidth;
    const strokeWidth = shape.getStrokeWidth();
    this.ctx.lineWidth = this.processAttr(shape, strokeWidth, data);

    if (shape instanceof CircleModel) {
      this.drawCircle(shape, offsetVec);
    }
    else if (shape instanceof RectangleModel) {
      this.drawRectangle(shape, offsetVec, fillColor);
    }
    else if (shape instanceof TriangleModel) {
      this.drawTriangle(shape, offsetVec);
    }
    else if (shape instanceof LineModel) {
      this.drawLine(shape, offsetVec);
    }
    else if (shape instanceof GroupModel) {
      this.drawSymbol(shape, offsetVec);
    }
    else if (shape instanceof ListModel) {
      this.drawList(shape, offsetVec, data);
    }
    else if (shape instanceof UserDefinedShapeModel) {
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
    // NOTE: values offset by 0.5 to make sharper rendering on the HTML canvas
    this.ctx.moveTo(this._actualCenterX + 0.5, 0.5);
    this.ctx.lineTo(this._actualCenterX + 0.5, this.canvas.height + 0.5);
    this.ctx.moveTo(0.5, this._actualCenterY + 0.5);
    this.ctx.lineTo(this.canvas.width + 0.5, this._actualCenterY + 0.5);
    this.ctx.stroke();
    this.ctx.lineWidth = savedLineWidth;
  }

  drawCircle(c, offsetVec) {

    let x = processIndexValue(c, c.getX());
    let y = processIndexValue(c, c.getY());

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    x *= this._scale;
    y *= this._scale;
    const radius = c.getRadius() * this._scale;

    this.ctx.beginPath();
    this.ctx.arc(this._x(x), this._y(y), radius, 0, 2*Math.PI); 
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawRectangle(r, offsetVec, fillColor) {
    let x = processIndexValue(r, r.getX());
    let y = processIndexValue(r, r.getY());

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    x *= this._scale;
    y *= this._scale;
    const width = r.getWidth() * this._scale;
    const height = r.getHeight() * this._scale;

    this.ctx.beginPath();
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    this.ctx.rect(
      this._x(x - halfWidth),
      this._y(y - halfHeight), width, -height);

    if (fillColor !== 'none') {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  drawTriangle(t, offsetVec) {
    let x = processIndexValue(t, t.getX());
    let y = processIndexValue(t, t.getY());

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }
    x *= this._scale;
    y *= this._scale;
    const x1 = t.getX1() * this._scale;
    const y1 = t.getY1() * this._scale;
    const x2 = t.getX2() * this._scale;
    const y2 = t.getY2() * this._scale;
    const x3 = t.getX3() * this._scale;
    const y3 = t.getY3() * this._scale;

    this.ctx.beginPath();
    this.ctx.moveTo(this._x(x + x1), this._y(y + y1));
    this.ctx.lineTo(this._x(x + x2), this._y(y + y2));
    this.ctx.lineTo(this._x(x + x3), this._y(y + y3));
    this.ctx.fill();
    // FIXME: isn't closing stroke
    this.ctx.stroke();
  }

  drawLine(l, offsetVec) {

    let x = l.getX();
    let y = l.getY();

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    x *= this._scale;
    y *= this._scale;
    const x1 = l.getX1() * this._scale;
    const y1 = l.getY1() * this._scale;
    const x2 = l.getX2() * this._scale;
    const y2 = l.getY2() * this._scale;

    this.ctx.beginPath();
    this.ctx.moveTo(this._x(x + x1), this._y(y + y1));
    this.ctx.lineTo(this._x(x + x2), this._y(y + y2));
    //this.ctx.fill();
    this.ctx.stroke();
  }

  drawList(l, offsetVec, data) {

    const ofTemplate = l.getOf();

    let length = l.getLength();
    if (length === undefined) {
      length = data.length;
    }

    const children = [];
    for (let i = 0; i < length; i++) {
      const child = _.cloneDeep(ofTemplate);
      child.setListIndex(i);
      child._id = i;
      children.push(child);
    }

    l.setChildren(children);
    this.drawSymbol(l, offsetVec, data);
  }

  drawSymbol(s, offsetVec, data) {

    let x = processIndexValue(s, s.getX());
    let y = processIndexValue(s, s.getY());

    const thisPos = new Vector2({ x, y });
    let cumulativeOffset = thisPos;
    if (offsetVec !== undefined) {
      cumulativeOffset = thisPos.add(offsetVec);
    }

    for (let child of s.getChildren()) {
      this.renderShape(child, cumulativeOffset, data);
    }
  }

  _x(x) {
    return this._actualCenterX + x;
  }

  _y(y) {
    return this._actualCenterY - y;
  }
}


module.exports = {
  ANMLRenderer,
};
