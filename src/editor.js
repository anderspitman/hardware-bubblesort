const { ANMLGenerator } = require('./generator');


class ANMLEditor {
  constructor({ domParentId }) {
    this.parent = document.getElementById(domParentId);
    this.textArea = document.createElement('textarea');
    this.textArea.spellcheck = false;
    this.parent.appendChild(this.textArea);

    this.generator = new ANMLGenerator();

    this.textArea.addEventListener('keyup', (e) => {
      if (this.onChangeCallback !== undefined) {
        const text = this.textArea.value;
        this.onChangeCallback(text);
      }
    });
  }

  onChange(callback) {
    this.onChangeCallback = callback;
  }

  update(model) {

    if (this.textArea !== document.activeElement) {
      const text = this.generator.generate(model);
      this.textArea.value = text;
    }
  }
}


module.exports = {
  ANMLEditor,
};
