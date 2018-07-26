const { ANMLParser } = require('./parser');
const { ANMLRenderer } = require('./renderer');
const { ANMLGenerator } = require('./generator');
const { ANMLEditor } = require('./editor');


fetch('/test.anml').then(response => {
  return response.text();
})
.then(text => {
  main(text)
})

function main(anmlFileText) {
  console.log(anmlFileText);
  const parser = new ANMLParser();
  let model = parser.parse(anmlFileText);
  const renderer = new ANMLRenderer({ domParentId: 'renderer' });
  const generator = new ANMLGenerator();
  const editor = new ANMLEditor({ domParentId: 'editor' });

  // TODO: clicking on the edge of the object then dragging causes the center
  // point of the object to jump to where the mouse is.
  let dragObj = null;
  renderer.onMouseDown((point) => {
    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(point);

      if (intersects) {
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
      dragObj.setX(point.x);
      dragObj.setY(point.y);
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

  function render() {
    renderer.render(model);
    generator.generate(model);
    editor.update(model);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function printObj(obj) {
  console.log(JSON.stringify(obj, null, 2));
}
