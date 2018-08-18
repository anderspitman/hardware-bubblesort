const { timeNowSeconds } = require('./utils');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { CodeEditor } = require('./code_editor');
const { VisualEditor } = require('./visual_editor');
const {
  connectPorts,
  createSwitch,
  createAndGate,
  createNandGate,
  createXnorGate,
  GreaterThan1,
  Comparator1,
  Comparator2,
  Comparator4,
  SwapIfGreater4,
  Swap4Set,
  BubbleSort,
  Mux1,
  Mux2,
  Mux4,
} = require('../lib/wild_logic/src/index');
const { PannerZoomer } = require('./panzoom');
const { InputHandler } = require('./input_handler');


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
  const inputHandler = new InputHandler({ domElementId: 'renderer' });
  const codeEditor = new CodeEditor({ domParentId: 'code_editor' });
  const visualEditor = new VisualEditor({
    domElementId: 'visual_editor',
    renderer,
    panzoom,
    inputHandler,
  });

  //renderer.setScale(0.05);

  panzoom.onPan((x, y) => {
  });

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

  codeEditor.onChange((text) => {
    try {
      const start = timeNowSeconds();
      const newModel = parser.parse(text);
      const parseTime = timeNowSeconds() - start;
      console.log(`Parse time: ${parseTime}`);
      model = newModel;

      model.addUpdateListener(() => {
        update();
      });

      update();
    }
    catch (e) {
      console.log(e);
    }
  });

  const sw1 = createSwitch();
  const sw2 = createSwitch();
  const sw3 = createSwitch();
  const sw4 = createSwitch();
  const sw5 = createSwitch();
  const sw6 = createSwitch();
  const sw7 = createSwitch();
  const sw8 = createSwitch();
  const sw9 = createSwitch();

  const data = {};
  const swap4Set = new Swap4Set();
  swap4Set.addSwap();
  swap4Set.addSwap();
  swap4Set.addSwap();
  swap4Set.addSwap();
  data.swap4Set = swap4Set;
  data.circs = [10, 15, 20, 25];
  data.circ = 5;

  const numValues = 8;
  const bsort = new BubbleSort(numValues);
  data.bubbleSort = bsort;

  const comp2 = new Comparator2();
  data.comp2 = comp2;
  connectPorts(sw1.out(), comp2.inA1());
  connectPorts(sw2.out(), comp2.inA0());
  connectPorts(sw3.out(), comp2.inB1());
  connectPorts(sw4.out(), comp2.inB0());

  const comp4 = new Comparator4();
  data.comp4 = comp4;
  connectPorts(sw1.out(), comp4.inA3());
  connectPorts(sw2.out(), comp4.inA2());
  connectPorts(sw3.out(), comp4.inA1());
  connectPorts(sw4.out(), comp4.inA0());
  connectPorts(sw5.out(), comp4.inB3());
  connectPorts(sw6.out(), comp4.inB2());
  connectPorts(sw7.out(), comp4.inB1());
  connectPorts(sw8.out(), comp4.inB0());

  const xnor = createXnorGate();
  data.xnor = xnor;
  connectPorts(sw1.out(), xnor.inA());
  connectPorts(sw2.out(), xnor.inB());

  const mux1 = new Mux1();
  data.mux1 = mux1;
  connectPorts(sw1.out(), mux1.inA());
  connectPorts(sw2.out(), mux1.inB());
  connectPorts(sw3.out(), mux1.inS());

  const mux2 = new Mux2();
  data.mux2 = mux2;
  connectPorts(sw1.out(), mux2.inA1());
  connectPorts(sw2.out(), mux2.inA0());
  connectPorts(sw3.out(), mux2.inB1());
  connectPorts(sw4.out(), mux2.inB0());
  connectPorts(sw5.out(), mux2.inS());

  const mux4 = new Mux4();
  data.mux4 = mux4;
  connectPorts(sw1.out(), mux4.inA3());
  connectPorts(sw2.out(), mux4.inA2());
  connectPorts(sw3.out(), mux4.inA1());
  connectPorts(sw4.out(), mux4.inA0());
  connectPorts(sw5.out(), mux4.inB3());
  connectPorts(sw6.out(), mux4.inB2());
  connectPorts(sw7.out(), mux4.inB1());
  connectPorts(sw8.out(), mux4.inB0());
  connectPorts(sw9.out(), mux4.inS());


  data.sw1 = sw1;
  data.sw2 = sw2;
  data.sw3 = sw3;
  data.sw4 = sw4;
  data.sw5 = sw5;
  data.sw6 = sw6;
  data.sw7 = sw7;
  data.sw8 = sw8;
  data.sw9 = sw9;

  sw1.setSwitchState(0);
  sw2.setSwitchState(0);
  sw3.setSwitchState(0);
  sw4.setSwitchState(0);
  sw5.setSwitchState(0);
  sw6.setSwitchState(0);
  sw7.setSwitchState(0);
  sw9.setSwitchState(0);

  visualEditor.onObjClick((obj) => {
    checkSwitches(obj);
    update();
  });

  //let val = 0;
  //setInterval(function() {
  //  //const start = timeNowSeconds();
  //  //bsort.setInputValue(0, val);
  //  ////console.log(`Time: ${timeNowSeconds() - start}`);
  //  //val++;
  //  //if (val > numValues) {
  //  //  val = 0;
  //  //}
  //  requestAnimationFrame(update);

  //}, 1000);

  function checkSwitches(clickedObj) {
    switch (clickedObj.getName()) {
      case 'sw1':
        flipSwitch(sw1);
        break;
      case 'sw2':
        flipSwitch(sw2);
        break;
      case 'sw3':
        flipSwitch(sw3);
        break;
      case 'sw4':
        flipSwitch(sw4);
        break;
      case 'sw5':
        flipSwitch(sw5);
        break;
      case 'sw6':
        flipSwitch(sw6);
        break;
      case 'sw7':
        flipSwitch(sw7);
        break;
      case 'sw8':
        flipSwitch(sw8);
        break;
      case 'sw9':
        flipSwitch(sw9);
        break;
    }
  }

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
    codeEditor.update(model);
    const editTime = timeNowSeconds();
    visualEditor.update(model);
    //console.log(`Edit time: ${editTime - renderTime}`);
    //requestAnimationFrame(update);
  }

  update();
}

function flipSwitch(sw) {
  if (sw.out().getState() === 0) {
    sw.setSwitchState(1);
  }
  else {
    sw.setSwitchState(0);
  }
}

function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
