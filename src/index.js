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

  let dragObj = null;
  let dragOffset;
  renderer.onMouseDown((point) => {

    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(point);

      if (intersects) {
        console.log(shape.getData());
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
  const sw1 = createSwitch();
  const sw2 = createSwitch();
  const sw3 = createSwitch();
  const sw4 = createSwitch();

  const and1 = createAndGate();
  const and2 = createAndGate();

  const gt1 = new GreaterThan1();

  connectPorts(sw1.out(), and1.inA());
  connectPorts(sw2.out(), and1.inB());
  connectPorts(sw3.out(), and2.inA());
  connectPorts(sw4.out(), and2.inB());

  connectPorts(sw1.out(), gt1.inA());
  connectPorts(sw2.out(), gt1.inB());

  data.and1 = and1;
  data.and2 = and2;
  data.gt1 = gt1;
  //data.and = 'Red';

  sw2.setSwitchState(0);
  sw4.setSwitchState(1);

  setInterval(() => {
    if (sw1.out().getState() === 0) {
      sw1.setSwitchState(1);
      sw2.setSwitchState(1);
      sw3.setSwitchState(0);
    }
    else {
      sw1.setSwitchState(0);
      sw2.setSwitchState(0);
      sw3.setSwitchState(1);
    }
  }, 1000);

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

function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
