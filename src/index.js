const { timeNowSeconds } = require('./utils');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { BubbleSort } = require('../lib/wild_logic/src/index');
const { PannerZoomer } = require('./panzoom');


class InputPanel {
  constructor({ domElementId, numInputs }) {
    this.el = document.getElementById(domElementId);
    const el = this.el;

    const dim = el.getBoundingClientRect();
    console.log(dim);
    const slotSize = dim.height / numInputs;

    for (let i = 0; i < numInputs; i++) {
      const input = new NumberInput({
        parentDomElement: el,
        lowerLimit: 0,
        upperLimit: 15,
        yOffset: (slotSize * i) + (slotSize / 2),
      });

      input.setValue(i);

      input.onChange((text) => {
        if (this._inputChangeCallback !== undefined) {
          this._inputChangeCallback(i, text);
        }
      });
    }
  }

  onInputChange(callback) {
    this._inputChangeCallback = callback;
  }
}

class NumberInput {
  constructor({ parentDomElement, lowerLimit, upperLimit, yOffset }) {
    const el = document.createElement('input');
    el.type = 'text';
    el.className = 'number-input';
    el.style = `top: ${yOffset}px`;
    parentDomElement.appendChild(el);

    this.el = el;
    this._lowerLimit = lowerLimit;
    this._upperLimit = upperLimit;

    el.addEventListener('change', (e) => {
      if (!this._validValue(el.value)) {
        alert(`Must enter a number between ${lowerLimit} and ${upperLimit}`);
        el.value = '';
        return;
      }

      if (this._changeCallback !== undefined) {
        this._changeCallback(Number(el.value));
      }
    });
  }

  setValue(value) {
    if (this._validValue(value)) {
      this.el.value = value;
    }
  }

  onChange(callback) {
    this._changeCallback = callback;
  }

  _validValue(value) {
    console.log(value);
    return !(isNaN(value) ||
      value < this._lowerLimit ||
      value > this._upperLimit);
  }
}


fetch('/test.anml').then(response => {
  return response.text();
})
.then(text => {
  main(text)
})

function main(anmlFileText) {
  const parser = new ANMLParser();
  let model = parser.parse(anmlFileText);
  const renderer = new ANMLRenderer({ domParentId: 'renderer' });
  const panzoom = new PannerZoomer({ domElementId: 'renderer' });

  renderer.setScale(0.03);

  panzoom.onPanEnded((x, y) => {
    renderer.translateViewPortCenter(x, y);
    panzoom.resetPan();
    update();
  });

  const renderZoom = () => {
    renderer.setScale(zoom);
    panzoom.resetZoom();
    update();
  };

  let lastTimeout;
  let zoom;
  panzoom.onZoom((zoomScale) => {
    if (lastTimeout) {
      clearTimeout(lastTimeout);
    }
    zoom = zoomScale;
    lastTimeout = setTimeout(renderZoom, 500);
  });

  model.addUpdateListener(() => {
    update();
  });

  const data = {};

  const numValues = 8;
  const bsort = new BubbleSort(numValues);
  data.bubbleSort = bsort;

  for (let i = 0; i < numValues; i++) {
    bsort.setInputValue(i, i);
  }

  const inputPanel = new InputPanel({
    domElementId: 'input_panel',
    numInputs: numValues,
  });

  inputPanel.onInputChange((i, value) => {
    bsort.setInputValue(i, value);
    update();
  });


  //let val = 0;
  //setInterval(function() {
  //  const start = timeNowSeconds();
  //  bsort.setInputValue(0, val);
  //  //console.log(`Time: ${timeNowSeconds() - start}`);
  //  val++;
  //  if (val > numValues) {
  //    val = 0;
  //  }
  //  requestAnimationFrame(update);

  //}, 1000);

  function update() {
    requestAnimationFrame(render);
  }

  function render() {
    const startTime = timeNowSeconds();
    model.update(data);
    const updateTime = timeNowSeconds();
    //console.log(`Update time: ${updateTime - startTime}`);
    renderer.render(model);
    const renderTime = timeNowSeconds();
    //console.log(`Render time: ${renderTime - updateTime}`);
    const editTime = timeNowSeconds();
  }

  update();
}
