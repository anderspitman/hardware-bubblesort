const { CircleModel } = require('./model');


class ANMLGenerator {
  generate(model) {

    let str = '';

    for (let shape of model.getShapes()) {
      if (shape instanceof CircleModel) {
        str += this.generateCircle(shape);
      }
    }

    return str;
  }

  generateCircle(c) {
    let str = '(Circle\n';

    const attrs = [
      [ 'x', c.getX.bind(c), 0 ],
      [ 'y', c.getY.bind(c), 0 ],
      [ 'radius', c.getRadius.bind(c), 10 ],
    ];

    for (let attr of attrs) {
      const ret = this.generateAttr(attr[0], attr[1](), attr[2]);
      if (ret !== '') {
        str += ret + '\n'; 
      }
    }

    str += ')';
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


module.exports = {
  ANMLGenerator,
}
