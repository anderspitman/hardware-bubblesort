const { timeNowSeconds } = require('./utils');
const { Vector2 } = require('./math');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { ANMLGenerator } = require('./generator');
const { ANMLEditor } = require('./editor');
const {
  connectPorts,
  createSwitch,
  createAndGate,
  createNandGate,
  createXnorGate,
  GreaterThan1,
  GreaterThan2,
  Comparator1,
  Comparator2,
  Comparator4,
  SwapIfGreater4,
} = require('../lib/wild_logic/src/index');
const { GroupModel } = require('./model');


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
  const generator = new ANMLGenerator();
  const editor = new ANMLEditor({ domParentId: 'editor' });

  const sw1 = createSwitch();
  const sw2 = createSwitch();
  const sw3 = createSwitch();
  const sw4 = createSwitch();
  const sw5 = createSwitch();
  const sw6 = createSwitch();
  const sw7 = createSwitch();
  const sw8 = createSwitch();

  let dragObj = null;
  let dragOffset;
  let panPoint = null;
  renderer.onMouseDown((point) => {
    console.log(point);

    let hitShape = false;

    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(point);

      if (intersects && shape.getName() !== 'box') {
        hitShape = true;

        checkSwitches(shape);
        
        const objPos = new Vector2({ x: shape.getX(), y: shape.getY() });
        dragOffset = point.subtract(objPos);
        dragObj = shape;

        if (shape instanceof GroupModel) {

          const groupPos = objPos;
          const relativePoint = point.subtract(groupPos);

          for (let child of shape.getChildren()) {
            const childPos = new Vector2({ x: child.getX(), y: child.getY() });
            if (child.intersects(relativePoint)) {
              hitShape = true;
              console.log(child);
              checkSwitches(child);
              break;
            }
          }
        }

        break;
      }
    }

    if (!hitShape) {
      console.log("hit canvas");
      panPoint = point;
    }
  });

  renderer.onMouseUp((point) => {
    dragObj = null;
    panPoint = null;
  });

  renderer.onMouseMove((point) => {
    if (dragObj !== null) {
      dragObj.setX(point.x - dragOffset.x);
      dragObj.setY(point.y - dragOffset.y);
    }
    else if (panPoint !== null) {
      const movementVec = point.subtract(panPoint);

      const negated = movementVec.scaledBy(-1.0);
      const prevCenter = renderer.getViewportCenter();
      const newCenter = prevCenter.add(negated);
      renderer.setViewportCenter({ x: newCenter.x, y: newCenter.y });
    }
  });

  editor.onChange((text) => {
    try {
      const start = timeNowSeconds();
      const newModel = parser.parse(text);
      const parseTime = timeNowSeconds() - start;
      console.log(`Parse time: ${parseTime}`);
      model = newModel;
    }
    catch (e) {
      console.log(e);
    }
  });

  const data = {};

  const and1 = createAndGate();
  const and2 = createAndGate();
  const nand1 = createNandGate();
  const xnor1 = createXnorGate();

  const gt1 = new GreaterThan1();
  const comp1 = new Comparator1();
  const comp2 = new Comparator2();
  const comp4 = new Comparator4();
  const swap4 = new SwapIfGreater4();

  connectPorts(sw1.out(), comp1.inA());
  connectPorts(sw2.out(), comp1.inB());

  connectPorts(sw1.out(), nand1.inA());
  connectPorts(sw2.out(), nand1.inB());

  connectPorts(sw1.out(), xnor1.inA());
  connectPorts(sw2.out(), xnor1.inB());

  connectPorts(sw1.out(), and1.inA());
  connectPorts(sw2.out(), and1.inB());
  connectPorts(sw3.out(), and2.inA());
  connectPorts(sw4.out(), and2.inB());

  connectPorts(sw1.out(), comp4.inA3());
  connectPorts(sw2.out(), comp4.inA2());
  connectPorts(sw3.out(), comp4.inA1());
  connectPorts(sw4.out(), comp4.inA0());
  connectPorts(sw5.out(), comp4.inB3());
  connectPorts(sw6.out(), comp4.inB2());
  connectPorts(sw7.out(), comp4.inB1());
  connectPorts(sw8.out(), comp4.inB0());

  connectPorts(sw1.out(), swap4.inA3());
  connectPorts(sw2.out(), swap4.inA2());
  connectPorts(sw3.out(), swap4.inA1());
  connectPorts(sw4.out(), swap4.inA0());
  connectPorts(sw5.out(), swap4.inB3());
  connectPorts(sw6.out(), swap4.inB2());
  connectPorts(sw7.out(), swap4.inB1());
  connectPorts(sw8.out(), swap4.inB0());

  connectPorts(sw1.out(), gt1.inA());
  // FIXME: if the switches aren't manually triggered below, the not gate
  // doesn't appear to get initialized properly
  connectPorts(sw2.out(), gt1.inB());

  data.sw1 = sw1;
  data.sw2 = sw2;
  data.sw3 = sw3;
  data.sw4 = sw4;
  data.sw5 = sw5;
  data.sw6 = sw6;
  data.sw7 = sw7;
  data.sw8 = sw8;

  data.and1 = and1;
  data.and2 = and2;
  data.gt1 = gt1;
  data.comp1 = comp1;
  data.nand1 = nand1;
  data.xnor1 = xnor1;
  data.comp2 = comp2;
  data.comp4 = comp4;
  data.swap4 = swap4;
  data.list = [1,2,3,4,5,6];

  sw1.setSwitchState(0);
  sw2.setSwitchState(0);
  sw3.setSwitchState(0);
  sw4.setSwitchState(0);
  sw5.setSwitchState(0);
  sw6.setSwitchState(0);
  sw7.setSwitchState(0);
  sw8.setSwitchState(0);

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
    }
  }

  function update() {
    //const obj = model.getShapes()[0];
    //obj.setX(obj.getX() + (1));
    const startTime = timeNowSeconds();
    model.update(data);
    const updateTime = timeNowSeconds();
    renderer.render(model);
    const renderTime = timeNowSeconds();
    //console.log(`Render duration: ${renderTime - startTime}`);
    generator.generate(model);
    editor.update(model);
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
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
