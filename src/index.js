const { Vector2 } = require('./math');
const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { ANMLGenerator } = require('./generator');
const { ANMLEditor } = require('./editor');
const {
  connectPorts,
  createSwitch,
  createAndGate,
  GreaterThan1,
} = require('../lib/wild_logic/src/index');


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

  let dragObj = null;
  let dragOffset;
  renderer.onMouseDown((point) => {

    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(point);

      if (intersects) {

        switch (shape.getName()) {
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
        }
        const objPos = new Vector2({ x: shape.getX(), y: shape.getY() });
        dragOffset = point.subtract(objPos);
        dragObj = shape;
        break;
      }
    }
  });

  renderer.onMouseUp((point) => {
    dragObj = null;
  });

  renderer.onMouseMove((point) => {
    if (dragObj !== null) {
      dragObj.setX(point.x - dragOffset.x);
      dragObj.setY(point.y - dragOffset.y);
    }
  });

  editor.onChange((text) => {
    try {
      const newModel = parser.parse(text);
      model = newModel;
    }
    catch (e) {
      console.log(e);
    }
  });

  const data = {};

  const and1 = createAndGate();
  const and2 = createAndGate();

  const gt1 = new GreaterThan1();

  connectPorts(sw1.out(), and1.inA());
  connectPorts(sw2.out(), and1.inB());
  connectPorts(sw3.out(), and2.inA());
  connectPorts(sw4.out(), and2.inB());

  connectPorts(sw1.out(), gt1.inA());
  // FIXME: if the switches aren't manually triggered below, the not gate
  // doesn't appear to get initialized properly
  connectPorts(sw2.out(), gt1.inB());

  data.and1 = and1;
  data.and2 = and2;
  data.gt1 = gt1;
  data.sw1 = sw1;
  data.sw2 = sw2;
  data.sw3 = sw3;
  data.sw4 = sw4;
  //data.and = 'Red';

  sw1.setSwitchState(0);
  sw2.setSwitchState(0);
  sw3.setSwitchState(0);
  sw4.setSwitchState(0);

  function update() {
    //const obj = model.getShapes()[0];
    //obj.setX(obj.getX() + (1));
    model.update(data);
    renderer.render(model);
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
