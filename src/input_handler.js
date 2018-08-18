const { Vector2 } = require('./math');


class InputHandler {
  constructor({ domElementId }) {
    this.el = document.getElementById(domElementId);

    this.el.addEventListener('mousedown', (e) => {

      if (this.onMouseDownCallback !== undefined) {
        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        this.onMouseDownCallback(clickPoint);
      }
    });

    this.el.addEventListener('mouseup', (e) => {

      if (this.onMouseUpCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        this.onMouseUpCallback(clickPoint);
      }
    });

    this.el.addEventListener('mousemove', (e) => {

      if (this.onMouseMoveCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX,
          y: e.clientY,
        });

        this.onMouseMoveCallback(clickPoint);
      }
    });

    this.keys = [];
    document.addEventListener('keyup', (e) => {
      this.keys[e.keyCode] = false;
    });
    document.addEventListener('keydown', (e) => {
      this.keys[e.keyCode] = true;
    });

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

  getKeyState(keyName) {
    let keyCode;
    switch(keyName) {
      case 'shift':
        keyCode = 16;
        break;
    }

    return this.keys[keyCode];
  }

}


module.exports = {
  InputHandler,
};
