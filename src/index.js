const { timeNowSeconds } = require('./utils');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { BubbleSort } = require('../lib/wild_logic/src/index');
const { PannerZoomer } = require('./panzoom');


const MIN = 0;
const MAX = 15;


class InputPanel {
  constructor({ domElementId, numInputs }) {
    this.el = document.getElementById(domElementId);
    const el = this.el;

    const dim = el.getBoundingClientRect();
    const inputHeight = dim.height / numInputs;
    const inputWidth = dim.width;

    for (let i = 0; i < numInputs; i++) {
      const inputEl = document.createElement('div');
      inputEl.style.height = inputHeight + 'px';
      inputEl.style.width = inputWidth + 'px';
      el.appendChild(inputEl);

      const input = new NumberInput({
        parentDomElement: inputEl,
        lowerLimit: 0,
        upperLimit: 15,
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
  constructor({ parentDomElement, lowerLimit, upperLimit }) {
    const el = document.createElement('div');
    el.className = 'number-input';
    parentDomElement.appendChild(el);

    const dim = parentDomElement.getBoundingClientRect();

    el.style.width = dim.width + 'px';
    el.style.height = dim.height + 'px';

    const upCont = document.createElement('div');
    upCont.style.width = dim.width + 'px';
    upCont.style.height = (dim.height / 6) + 'px';
    el.appendChild(upCont);

    const upBtn = new Button({
      parentDomElement: upCont,
      imageUrl: '/up_arrow.svg',
      onClick: (e) => {
        this.incrementValue();
      }
    });

    const text = document.createElement('div');
    text.className = 'number-text';
    el.appendChild(text);

    const downCont = document.createElement('div');
    downCont.style.width = dim.width + 'px';
    downCont.style.height = (dim.height / 6) + 'px';
    el.appendChild(downCont);

    const downBtn = new Button({
      parentDomElement: downCont,
      imageUrl: '/down_arrow.svg',
      onClick: (e) => {
        this.decrementValue();
      }
    });

    this.el = el;
    this.text = text;
    this._lowerLimit = lowerLimit;
    this._upperLimit = upperLimit;
    this._currentValue = 0;

    this.setValue(this._currentValue);
  }

  incrementValue() {
    let newValue = this._currentValue + 1;

    if (newValue > this._upperLimit) {
      newValue = this._lowerLimit;
    }
    this.setValue(newValue);
  }

  decrementValue() {
    let newValue = this._currentValue - 1;

    if (newValue < this._lowerLimit) {
      newValue = this._upperLimit;
    }
    this.setValue(newValue);
  }

  setValue(value) {
    if (this._validValue(value)) {
      this._currentValue = value;
      this.text.innerHTML = String(value);

      if (this._changeCallback !== undefined) {
        this._changeCallback(value);
      }
    }
  }

  onChange(callback) {
    this._changeCallback = callback;
  }

  _validValue(value) {
    return value >= this._lowerLimit && value <= this._upperLimit;
  }
}

class Button {
  constructor({ parentDomElement, imageUrl, onClick }) {

    const dim = parentDomElement.getBoundingClientRect();

    //const btn = document.createElement('input');
    //const btn = document.createElement('div');
    const btn = document.createElement('img');
    btn.src = imageUrl;
    btn.style.width = dim.width + 'px';
    btn.style.height = dim.height + 'px';
    btn.style.backgroundColor = '#71ed55';
    parentDomElement.appendChild(btn);

    btn.addEventListener('click', onClick);
  }
}


class OutputPanel {
  constructor({ domElementId, numOutputs }) {
    this.el = document.getElementById(domElementId);
    const el = this.el;

    const dim = el.getBoundingClientRect();
    const width = dim.width;
    const height = dim.height / numOutputs;

    this._outputs = [];

    for (let i = 0; i < numOutputs; i++) {
      const outputEl = document.createElement('div');
      outputEl.style.height = height + 'px';
      outputEl.style.width = width + 'px';
      el.appendChild(outputEl);

      const output = new NumberOutput({
        parentDomElement: outputEl,
        lowerLimit: MIN,
        upperLimit: MAX,
      });

      this._outputs.push(output);

      output.setValue(i);
    }
  }

  setOutputValue(index, value) {
    this._outputs[index].setValue(value);
  }
}

class NumberOutput {
  constructor({ parentDomElement, lowerLimit, upperLimit }) {

    const MAX_HEIGHT = 20;

    const el = document.createElement('span');
    el.className = 'number-output';
    parentDomElement.appendChild(el);

    const dim = parentDomElement.getBoundingClientRect();
    el.style.width = dim.width + 'px';

    const text = document.createElement('div');
    text.className = 'number-text';
    text.style.fontSize =
      (dim.height > MAX_HEIGHT ? MAX_HEIGHT : dim.height) + 'px';
    el.appendChild(text);

    this.el = el;
    this.text = text;
    this._lowerLimit = lowerLimit;
    this._upperLimit = upperLimit;
    this._currentValue = 0;

    this.setValue(this._currentValue);
  }

  setValue(value) {
    if (this._validValue(value)) {
      this._currentValue = value;
      this.text.innerHTML = String(value);
    }
  }

  _validValue(value) {
    return value >= this._lowerLimit && value <= this._upperLimit;
  }
}


fetch('/test.anml').then(response => {
  return response.text();
})
.then(text => {
  main(text)
})

function main(anmlFileText) {

  const numValues = 8;

  // set up layout
  const container = document.getElementById('container');
  const rendererEl = document.getElementById('renderer');
  const inputEl = document.getElementById('input_panel');
  const outputEl = document.getElementById('output_panel');
  const bottomEl = document.getElementById('bottom-banner');

  container.style.height = window.innerHeight + 'px';
  //container.style.height = window.innerHeight + 'px';

  const containerDim = container.getBoundingClientRect();
  const rendererDim = rendererEl.getBoundingClientRect();
  const inDim = inputEl.getBoundingClientRect();
  const outDim = outputEl.getBoundingClientRect();
  const bottomDim = bottomEl.getBoundingClientRect();

  const renderWidth = containerDim.width - (inDim.width + outDim.width);
  rendererEl.style.width = renderWidth + 'px';
  rendererEl.style.height = (containerDim.height - bottomDim.height) + 'px';

  const inputPanel = new InputPanel({
    domElementId: 'input_panel',
    numInputs: numValues,
  });

  inputPanel.onInputChange((i, value) => {
    bsort.setInputValue(i, value);

    update();
  });

  const outputPanel = new OutputPanel({
    domElementId: 'output_panel',
    numOutputs: numValues,
  });


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

  const bsort = new BubbleSort(numValues);
  data.bubbleSort = bsort;

  for (let i = 0; i < numValues; i++) {
    bsort.setInputValue(i, i);
  }

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

    for (let i = 0; i < numValues; i++) {
      const outValue = bsort.getOutputValue(i);
      outputPanel.setOutputValue(i, outValue);
    }

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
