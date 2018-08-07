const { Vector2 } = require('./math');

// TODO: Panner and Zoomer are combined into one class because I couldn't
// figure out a way to set the transform scale and translate separately. How
// stupid is that? The web is so stupid sometimes.
class PannerZoomer {
  constructor({ domParentId }) {
    this.parent = document.getElementById(domParentId);

    this._pan = new Vector2({ x: 0, y: 0 });

    this.setZoomingScale(1.0);
    this.resetPan();
    this.enable();

    let panStartPoint;

    const SCALE_MULTIPLIER = 1.10;
    const SCALE_MIN = 0.001;
    const SCALE_MAX = 1000;

    this.parent.addEventListener('mousedown', (e) => {
      if (this._enabled) {
        panStartPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });
      }
    });

    this.parent.addEventListener('mouseup', (e) => {
      if (this._enabled) {
        panStartPoint = null;

        if (this._pan) {

          if (this._onPanEnded) {
            this._onPanEnded(-this._pan.x, this._pan.y);
          }

          this._centerX = this._pan.x;
          this._centerY = this._pan.y;
        }
      }
    });

    this.parent.addEventListener('mousemove', (e) => {

      if (this._enabled) {
        if (panStartPoint) {
          const movePoint = new Vector2({
            x: e.clientX,
            y: e.clientY,
          });

          this._pan = movePoint.subtract(panStartPoint);
          this._pan.x += this._centerX;
          this._pan.y += this._centerY;
          this.updateTransform();

          if (this._onPanCallback) {
            this._onPanCallback(-this._pan.x, this._pan.y);
          }
        }
      }
    });

    let lastTimeout;
    this.parent.addEventListener('wheel', (e) => {
      if (this._enabled) {
        let newZoom;
        if (e.deltaY > 0) {
          newZoom = this.getZoomingScale() / SCALE_MULTIPLIER;
        }
        else {
          newZoom = this.getZoomingScale() * SCALE_MULTIPLIER;
        }

        this.setZoomingScale(newZoom);

        if (lastTimeout) {
          clearTimeout(lastTimeout);
        }
        this._zooming = true;
        //lastTimeout = setTimeout(renderZoom, 100);
        e.preventDefault();

        if (this._onZoomCallback) {
          this._onZoomCallback(this._zoomScale);
        }
      }
    });
  }

  updateTransform() {
    const transform =
      `translate(${this._pan.x}px, ${this._pan.y}px) scale(${this._zoomScale})`;
    this.parent.style.transform = transform;
    //this.parent.style['transform-origin'] = '0 0';
  }

  getZoomingScale() {
    return this._zoomScale;
  }
  setZoomingScale(scale) {
    this._zoomScale = scale;
    this.updateTransform();
  }

  resetPan() {
    this._centerX = 0;
    this._centerY = 0;
    this._pan.x = 0;
    this._pan.y = 0;
    this.updateTransform();
  }

  resetZoom() {
    this._zoomScale = 1.0;
    this.updateTransform();
  }

  enable() {
    this._enabled = true;
  }

  disable() {
    this._enabled = false;
  }

  onZoom(callback) {
    this._onZoomCallback = callback;
  }

  onPan(callback) {
    this._onPanCallback = callback;
  }

  onPanEnded(callback) {
    this._onPanEnded = callback;
  }
}

module.exports = {
  PannerZoomer,
};
