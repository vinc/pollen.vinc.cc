var fs = require('fs');

module.exports = function(query) {
  return fs.readFileSync('./sql/' + query + '.sql').toString();
};
