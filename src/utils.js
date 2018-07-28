// taken from
// https://stackoverflow.com/a/1026087/943814
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getDataByPath(obj, path) {
  let data = obj;

  for (let key of path) {
    if (data[key] === undefined) {
      return null;
    }
    data = data[key];
  }

  return data;
}

module.exports = {
  capitalize,
  getDataByPath,
};
