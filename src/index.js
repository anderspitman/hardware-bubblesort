const { Vector2 } = require('./math');
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
  const parser = new ANMLParser();
  let model = parser.parse(anmlFileText);
  const renderer = new ANMLRenderer({ domParentId: 'renderer' });
  const generator = new ANMLGenerator();
  const editor = new ANMLEditor({ domParentId: 'editor' });

  let dragObj = null;
  let dragOffset;
  renderer.onMouseDown((canvasPoint) => {

    const worldOrigin = renderer.getViewportCenter();
    const worldPoint = canvasPoint.subtract(worldOrigin);
    worldPoint.y = -worldPoint.y;
    for (let shape of model.getShapes()) {
      const intersects = shape.intersects(worldPoint);

      if (intersects) {
        const objPos = new Vector2({ x: shape.getX(), y: shape.getY() });
        dragOffset = worldPoint.subtract(objPos);
        dragObj = shape;
        break;
      }
    }
  });

  renderer.onMouseUp((point) => {
    dragObj = null;
  });

  renderer.onMouseMove((canvasPoint) => {
    const worldOrigin = renderer.getViewportCenter();
    const worldPoint = canvasPoint.subtract(worldOrigin);
    worldPoint.y = -worldPoint.y;

    if (dragObj !== null) {
      dragObj.setX(worldPoint.x - dragOffset.x);
      dragObj.setY(worldPoint.y - dragOffset.y);
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
