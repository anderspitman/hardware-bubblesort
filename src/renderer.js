const { timeNowSeconds } = require('./utils');
const { Vector2 } = require('./math');
const {
  processMagicValue,
  ConstantDefinitionModel,
  DataValueModel,
  DataTernaryModel,
  IndexOperationModel,
  ShapeModel,
  GroupModel,
  ListModel,
  ArcModel,
  RectangleModel,
  TriangleModel,
  LineModel,
  MultiLineModel,
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
    this.parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this._scale = 1.0;

    
    this.setViewportCenter({ x: 0, y: 0 });
  }

  toWorldCoordinates(clickPoint) {
    const worldOrigin = this.getActualCenter();
    const worldPoint = clickPoint.subtract(worldOrigin);
    worldPoint.y = -worldPoint.y;
    worldPoint.x /= this._scale;
    worldPoint.y /= this._scale;
    return worldPoint;
  }

  setScale(scale) {
    this._scale *= scale;
    this.updateViewport();
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

  getWorldCoordinates(x, y) {
    return new Vector2({
      x: x - (this.canvas.width / 2),
      y: y - (this.canvas.height / 2),
    });
  }

  setViewportCenter({ x, y }) {
    this._viewPortCenterX = x;
    this._viewPortCenterY = y;
    this.updateViewport();
  }

  updateViewport() {
    const center = this.getViewportCenter();
    const x = -center.x * this._scale;
    const y = center.y * this._scale;
    this._actualCenterX = x + (this.canvas.width / 2);
    this._actualCenterY = y + (this.canvas.height / 2 );
  }

  translateViewPortCenter(x, y) {
    x /= this._scale;
    y /= this._scale;
    const center = this.getViewportCenter();
    this.setViewportCenter({ x: center.x + x, y: center.y + y });
  }

  render(model) {
    this._model = model;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    //const viewPortOffset = new Vector2({
    //  x: this._actualCenterX,
    //  y: this._actualCenterY
    //});

    for (let child of model.getObjects()) {
      if (child instanceof ShapeModel) {
        this.renderShape(child);  
      }

      //this.renderShape(shape, viewPortOffset);  
      // if the user has started zooming since the render began, abort. This
      // makes zooming smoother because the current render doesn't have to
      // complete
      if (this._zooming) {
        break;
      }
    }
  }

  processAttr(shape, attr, data) {
    if (attr instanceof ConstantDefinitionModel) {
      return attr.getValue();
    }
    else if (attr instanceof DataValueModel) {
      const path = [shape.getDataKey()].concat(attr.getPath());
      const val = getDataByPath(data, attr.getPath());
      return val;
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

    if (this._zooming) {
      return;
    }

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
    this.ctx.lineWidth = this.processAttr(shape, strokeWidth, data) * this._scale;

    // NOTE: this handles circles as well because CircleModel inherits from
    // ArcModel
    if (shape instanceof ArcModel) {
      this.drawArc(shape, offsetVec, strokeColor, fillColor);
    }
    else if (shape instanceof RectangleModel) {
      this.drawRectangle(shape, offsetVec, strokeColor, fillColor);
    }
    else if (shape instanceof TriangleModel) {
      this.drawTriangle(shape, offsetVec, strokeColor, fillColor);
    }
    else if (shape instanceof LineModel) {
      this.drawLine(shape, offsetVec);
    }
    else if (shape instanceof MultiLineModel) {
      this.drawMultiLine(shape, offsetVec);
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

  drawGrid() {
    const savedLineWidth = this.ctx.lineWidth;
    this.ctx.lineWidth = 1 * this._scale;
    this.ctx.beginPath();
    // NOTE: values offset by 0.5 to make sharper rendering on the HTML canvas
    this.ctx.moveTo(this._actualCenterX + 0.5, 0.5);
    this.ctx.lineTo(this._actualCenterX + 0.5, this.canvas.height + 0.5);
    this.ctx.moveTo(0.5, this._actualCenterY + 0.5);
    this.ctx.lineTo(this.canvas.width + 0.5, this._actualCenterY + 0.5);
    this.ctx.stroke();
    this.ctx.lineWidth = savedLineWidth * this._scale;
  }

  drawArc(a, offsetVec, strokeColor, fillColor) {

    let x = processMagicValue(a, a.getX());
    let y = processMagicValue(a, a.getY());

    if (offsetVec !== undefined) {
      x += offsetVec.x;
      y += offsetVec.y;
    }

    x *= this._scale;
    y *= this._scale;
    let radius = processMagicValue(a, a.getRadius());
    radius *= this._scale;

    const startAngle = -a.getStartAngle();
    const endAngle = -a.getEndAngle();
    const anticlockwise = true;

    this.ctx.beginPath();
    this.ctx.arc(
      this._x(x), this._y(y), radius, startAngle, endAngle, anticlockwise); 
    if (fillColor !== 'none') {
      this.ctx.fill();
    }
    if (strokeColor !== 'none') {
      this.ctx.stroke();
    }
  }

  drawRectangle(r, offsetVec, strokeColor, fillColor) {
    let x = processMagicValue(r, r.getX());
    let y = processMagicValue(r, r.getY());

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
    if (strokeColor !== 'none') {
      this.ctx.stroke();
    }
  }

  drawTriangle(t, offsetVec, strokeColor, fillColor) {
    let x = processMagicValue(t, t.getX());
    let y = processMagicValue(t, t.getY());

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
    if (fillColor !== 'none') {
      this.ctx.fill();
    }

    if (strokeColor !== 'none') {
      this.ctx.stroke();
    }
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

  drawMultiLine(s, offsetVec, data) {

    let x = processMagicValue(s, s.getX());
    let y = processMagicValue(s, s.getY());

    const thisPos = new Vector2({ x, y });
    let cumulativeOffset = thisPos;
    if (offsetVec !== undefined) {
      cumulativeOffset = thisPos.add(offsetVec);
    }

    this.ctx.beginPath();

    const points = s.getPoints();
    const start = points[0];

    if (start !== undefined) {
      const offsetX = cumulativeOffset.x + start.getX();
      const offsetY = cumulativeOffset.y + start.getY();
      const x = offsetX * this._scale;
      const y = offsetY * this._scale;
      this.ctx.moveTo(this._x(x), this._y(y));
    }

    for (let point of points.slice(1)) {
      const offsetX = cumulativeOffset.x + point.getX();
      const offsetY = cumulativeOffset.y + point.getY();
      const x = offsetX * this._scale;
      const y = offsetY * this._scale;
      this.ctx.lineTo(this._x(x), this._y(y));

      if (point.getShow()) {
        this.ctx.arc(this._x(x), this._y(y), 10, 0, Math.PI*2); 
        this.ctx.moveTo(this._x(x), this._y(y));
      }
    }

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
      child.setData(data[i]);
      children.push(child);
    }

    l.setChildren(children);

    //this.drawSymbol(l, offsetVec, data);
    this.drawSymbol(l, offsetVec);
  }

  drawSymbol(s, offsetVec, data) {

    let x = processMagicValue(s, s.getX());
    let y = processMagicValue(s, s.getY());

    const thisPos = new Vector2({ x, y });
    let cumulativeOffset = thisPos;
    if (offsetVec !== undefined) {
      cumulativeOffset = thisPos.add(offsetVec);
    }

    for (let child of s.getChildren()) {
      if (child instanceof ShapeModel) {
        this.renderShape(child, cumulativeOffset, data);
      }
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
