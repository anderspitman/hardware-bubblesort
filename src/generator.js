const { CircleModel, RectangleModel } = require('./model');


class ANMLGenerator {
  generate(model) {

    let str = '';

    for (let shape of model.getShapes()) {
      if (shape instanceof CircleModel) {
        str += this.generateCircle(shape);
      }
      else if (shape instanceof RectangleModel) {
        str += this.generateRectangle(shape);
      }
    }

    return str;
  }

  generateCircle(c) {
    let str = '(Circle\n';

    const attrs = [
      [ 'x', c, 0 ],
      [ 'y', c, 0 ],
      [ 'radius', c, 10 ],
    ];

    str += this.generateAttrs(attrs);
    return str;
  }

  generateRectangle(r) {
    let str = '(Rectangle\n';

    const attrs = [
      [ 'x', r, 0 ],
      [ 'y', r, 0 ],
      [ 'width', r, 10 ],
      [ 'height', r, 10 ],
    ];

    str += this.generateAttrs(attrs);
    return str;
  }

  generateAttrs(attrs) {
    let str = '';

    for (let attr of attrs) {
      const methodName = 'get' + capitalize(attr[0]);
      const ret = this.generateAttr(attr[0], attr[1][methodName](), attr[2]);
      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    str += ')\n';
    return str;
  }

  generateAttr(key, value, defaultValue, post = '') {
    if (value !== defaultValue) {
      return '  (' + key + ' ' + value + ')' + post;
    }
    else {
      return '';
    }
  }
}

// taken from
// https://stackoverflow.com/a/1026087/943814
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  ANMLGenerator,
}
