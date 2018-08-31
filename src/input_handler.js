const { Vector2 } = require('./math');


class InputHandler {
  constructor({ domElementId }) {
    this.el = document.getElementById(domElementId);

    function calculateOffset(element) {
      let parent = element.parentElement;

      let offsetTop = element.offsetTop;
      let offsetLeft = element.offsetLeft;

      while (parent) {
        offsetTop += parent.offsetTop;
        offsetLeft += parent.offsetLeft;
        parent = parent.parentElement;
      }

      return {
        offsetTop,
        offsetLeft,
      };
    }

    this.el.addEventListener('mousedown', (e) => {

      const offset = calculateOffset(e.target);

      if (this.onMouseDownCallback !== undefined) {
        const clickPoint = new Vector2({
          x: e.clientX - offset.offsetLeft,
          y: e.clientY - offset.offsetTop,
        });

        this.onMouseDownCallback(clickPoint);
      }
    });

    this.el.addEventListener('mouseup', (e) => {
      
      const offset = calculateOffset(e.target);

      if (this.onMouseUpCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX - offset.offsetLeft,
          y: e.clientY - offset.offsetTop,
        });

        this.onMouseUpCallback(clickPoint);
      }
    });

    this.el.addEventListener('mousemove', (e) => {

      const offset = calculateOffset(e.target);

      if (this.onMouseMoveCallback !== undefined) {

        const clickPoint = new Vector2({
          x: e.clientX - offset.offsetLeft,
          y: e.clientY - offset.offsetTop,
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
