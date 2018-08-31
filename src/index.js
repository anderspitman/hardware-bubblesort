const { timeNowSeconds } = require('./utils');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { BubbleSort } = require('../lib/wild_logic/src/index');
const { PannerZoomer } = require('./panzoom');
const { InputHandler } = require('./input_handler');
const { RectangleModel } = require('./model');


const MIN = 0;
const MAX = 15;


fetch('/test.anml').then(response => {
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

  container.style.height = window.innerHeight + 'px';
  //container.style.height = window.innerHeight + 'px';

  const containerDim = container.getBoundingClientRect();
  const rendererDim = rendererEl.getBoundingClientRect();
  const bottomDim = bannerEl.getBoundingClientRect();

  const renderWidth = containerDim.width;
  const renderHeight = containerDim.height;
  rendererEl.style.width = renderWidth + 'px';
  rendererEl.style.height = (containerDim.height - bottomDim.height) + 'px';

  const parser = new ANMLParser();
  let model = parser.parse(anmlFileText);
  const renderer = new ANMLRenderer({ domParentId: 'renderer' });
  const panzoom = new PannerZoomer({ domElementId: 'renderer' });
  const inputHandler = new InputHandler({ domElementId: 'renderer' });

  const data = {};
  let decrementInputValue;
  let incrementInputValue;
  let bsort;

  function incrementNumValues() {
    numValues++;
    initBsort();
    update();
  }

  function decrementNumValues() {
    numValues--;
    if (numValues < 2) {
      numValues = 2;
    }
    initBsort();
    update();
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
      update();
    };

    decrementInputValue = (index) => {
      bsort.decrementInputValue(index);
      update();
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

  //inputHandler.onMouseUp((clickPoint) => {
  //  const point = renderer.toWorldCoordinates(clickPoint);
  //});

  //inputHandler.onMouseMove((clickPoint) => {
  //  const point = renderer.toWorldCoordinates(clickPoint);
  //});

  model.addUpdateListener(() => {
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

    for (let i = 0; i < numValues; i++) {
      const outValue = bsort.getOutputValue(i);
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
