const { timeNowSeconds } = require('./utils');
const {
  Swap4Set,
  Binary4Input,
  Binary4Output,
  connectPorts,
} = require('../lib/wild-logic');
const {
  PannerZoomer,
  InputHandler,
  Renderer,
  Parser,
} = require('../lib/anml');


const MIN = 0;
const MAX = 15;


class BubbleSort {

  constructor(numValues) {
    const numSets = numValues - 1;

    this._swapSets = [];
    this._inputs = [];
    this._outputs = [];

    // TODO: huge hack just because I'm lazy and want to ship this thing. I
    // just fiddled with the numbers until it worked.
    const outOffsetX = 800 + (1400 * (numValues - 2));

    for (let i = 0; i < numSets; i++) {
      const swapSet = new Swap4Set()
      this._swapSets.push(swapSet);

      for (let j = 0; j < numSets-i; j++) {
        const swap = swapSet.addSwap();

        swap.isFirst = 0;
        swap.isLast = 0;

        if (i > 0) {
          const prevSetSwap = this._swapSets[i-1].getSwap(j+1);
          connectPorts(prevSetSwap.outX3(), swap.inB3());
          connectPorts(prevSetSwap.outX2(), swap.inB2());
          connectPorts(prevSetSwap.outX1(), swap.inB1());
          connectPorts(prevSetSwap.outX0(), swap.inB0());
        }
      }

      // add a probe to each last swap
      const swaps = swapSet.getSwaps();
      const firstSwap = swapSet.getSwap(0);
      firstSwap.isFirst = 1;
      const lastSwap = swaps[swaps.length - 1];
      lastSwap.isLast = 1;
      const numSteps = numSets - i - 1;
      lastSwap.wireLength = numSteps * 1400;
      const output = new Binary4Output();
      output.offsetX = outOffsetX;
      this._outputs.unshift(output);

      connectPorts(lastSwap.outY3(), output.in3());
      connectPorts(lastSwap.outY2(), output.in2());
      connectPorts(lastSwap.outY1(), output.in1());
      connectPorts(lastSwap.outY0(), output.in0());

      if (i > 0) {
        const firstSwap = swapSet.getSwap(0);
        const prevSetFirstSwap = this._swapSets[i-1].getSwap(0);
        connectPorts(prevSetFirstSwap.outX3(), firstSwap.inA3());
        connectPorts(prevSetFirstSwap.outX2(), firstSwap.inA2());
        connectPorts(prevSetFirstSwap.outX1(), firstSwap.inA1());
        connectPorts(prevSetFirstSwap.outX0(), firstSwap.inA0());
      }
    }

    // initialize first set. This one is different because it needs to be
    // hooked up to external inputs
    const firstSet = this._swapSets[0];
    const firstSwap = firstSet.getSwap(0);
    const bin4In = new Binary4Input();
    this._inputs.push(bin4In);
    connectPorts(bin4In.out3(), firstSwap.inA3());
    connectPorts(bin4In.out2(), firstSwap.inA2());
    connectPorts(bin4In.out1(), firstSwap.inA1());
    connectPorts(bin4In.out0(), firstSwap.inA0());

    bin4In.setValue(11);
    
    const swaps = firstSet.getSwaps();
    for (let i = 0; i < swaps.length; i++ ) {
      const swap = swaps[i];

      const bin4In = new Binary4Input();

      connectPorts(bin4In.out3(), swap.inB3());
      connectPorts(bin4In.out2(), swap.inB2());
      connectPorts(bin4In.out1(), swap.inB1());
      connectPorts(bin4In.out0(), swap.inB0());

      bin4In.setValue(i+1);
      this._inputs.push(bin4In);
    }

    const lastSet = this._swapSets[this._swapSets.length - 1];
    const firstLastSwap = lastSet.getSwap(0);
    const bin4Out = new Binary4Output();
    bin4Out.offsetX = outOffsetX;
    this._outputs.unshift(bin4Out);
    connectPorts(firstLastSwap.outX3(), bin4Out.in3());
    connectPorts(firstLastSwap.outX2(), bin4Out.in2());
    connectPorts(firstLastSwap.outX1(), bin4Out.in1());
    connectPorts(firstLastSwap.outX0(), bin4Out.in0());
  }

  getSwapSets() {
    return this._swapSets;
  }

  setInputValue(inputIndex, value) {
    this._inputs[inputIndex].setValue(value);
  }

  incrementInputValue(inputIndex) {
    this._inputs[inputIndex].incrementValue();
  }

  decrementInputValue(inputIndex) {
    this._inputs[inputIndex].decrementValue();
  }

  getOutputValue(outputIndex) {
    return this._outputs[outputIndex].getValue();
  }
}


fetch('./parts.anml').then(response => {
  return response.text();
})
.then(text => {
  main(text)
})


function main(anmlFileText) {

  let numValues = 4;

  // set up layout
  const container = document.getElementById('container');
  const rendererEl = document.getElementById('renderer');
  const bannerEl = document.getElementById('banner');
  const bannerText = bannerEl.innerHTML;
  //const bannerTextColor = '#71ed55';
  const bannerTextColor = bannerEl.style.color;
  //const bannerBgColor = '#333333';
  const bannerBgColor = bannerEl.style.backgroundColor;

  container.style.height = window.innerHeight + 'px';

  const containerDim = container.getBoundingClientRect();
  const rendererDim = rendererEl.getBoundingClientRect();
  const bottomDim = bannerEl.getBoundingClientRect();

  const renderWidth = containerDim.width;
  const renderHeight = containerDim.height;
  rendererEl.style.width = renderWidth + 'px';
  rendererEl.style.height = (containerDim.height - bottomDim.height) + 'px';

  const parser = new Parser();
  let model = parser.parse(anmlFileText);
  const renderer = new Renderer({ domParentId: 'renderer' });
  const panzoom = new PannerZoomer({ domElementId: 'renderer' });
  const inputHandler = new InputHandler({ domElementId: 'renderer' });

  const data = {};
  let decrementInputValue;
  let incrementInputValue;
  let bsort;

  function incrementNumValues() {
    numValues++;
    initBsort();
    fullUpdate();
  }

  function decrementNumValues() {
    numValues--;
    if (numValues < 2) {
      numValues = 2;
    }
    initBsort();
    fullUpdate();
  }

  function initBsort() {

    data.numValues = { value: numValues };

    bsort = new BubbleSort(numValues);
    data.bubbleSort = bsort;

    for (let i = 0; i < numValues; i++) {
      bsort.setInputValue(i, i);
    }

    incrementInputValue = (index) => {
      bsort.incrementInputValue(index);
      fullUpdate();
    };

    decrementInputValue = (index) => {
      bsort.decrementInputValue(index);
      fullUpdate();
    };
  }

  initBsort();

  // Limit by smallest dimension.
  // TODO: this doesn't work very well. Needs to be updated once we have
  // access to the shape dimensions, which I'm planning to add eventually.
  const scaleFactor = 0.00006;
  let scale;
  if (renderWidth > renderHeight) {
    scale = scaleFactor * renderWidth;
  }
  else {
    scale = scaleFactor * renderHeight;
  }

  renderer.setScale(scale);

  panzoom.onPanEnded((x, y) => {
    requestAnimationFrame(() => {
      bannerEl.innerHTML = "rendering...";
      requestAnimationFrame(() => {
        renderer.translateViewPortCenter(x, y);
        panzoom.resetPan();
        update();
      });
    });
  });

  const renderZoom = () => {
    requestAnimationFrame(() => {
      bannerEl.innerHTML = "rendering...";
      requestAnimationFrame(() => {
        renderer.setScale(zoom);
        panzoom.resetZoom();
        update();
      });
    });
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

  inputHandler.onMouseDown((clickPoint) => {

    const point = renderer.toWorldCoordinates(clickPoint);

    for (let obj of model.getObjects()) {
      const name = obj.getName();
      if (name === 'bsort') {
        for (let child of obj.getChildren()) {
          if (child.getName() === 'inputs') {
            const inputs = child.getChildren();
            for (let i = 0; i < inputs.length; i++) {
              const input = inputs[i];
              for (let child of input.getChildren()) {
                if (child.getName() === 'up') {
                  if (child.intersectsGlobal(point)) {
                    incrementInputValue(i);
                  }
                }
                else if (child.getName() === 'down') {
                  if (child.intersectsGlobal(point)) {
                    decrementInputValue(i);
                  }
                }
              }
            }
            break;
          }
        }
      }
      else if (name === 'labeledInput') {
        for (let child of obj.getChildren()) {
          if (child.getName() === 'numberInput') {
            for (let inChild of child.getChildren()) {
              if (inChild.getName() === 'up') {
                if (inChild.intersectsGlobal(point)) {
                  incrementNumValues();
                }
              }
              else if (inChild.getName() === 'down') {
                if (inChild.intersectsGlobal(point)) {
                  decrementNumValues();
                }
              }
            }

            break;
          }
        }
      }
    }
  });

  model.addUpdateListener(() => {
    fullUpdate();
  });

  function fullUpdate() {
    requestAnimationFrame(() => {
      bannerEl.innerHTML = "rendering...";
      requestAnimationFrame(update);
    });
  }

  function update() {

    for (let i = 0; i < numValues; i++) {
      // NOTE: this is a hack. Calling getOutputValue has the side-effect of
      // updating the internal value so it displays properly in ANML
      bsort.getOutputValue(i);
    }

    render();
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

    bannerEl.innerHTML = bannerText;
    bannerEl.style.color = bannerTextColor;
    bannerEl.style.backgroundColor = bannerBgColor;
  }

  fullUpdate();
}
