var fs = require('fs');
var pg = require('pg');
var url = require('url');

if (typeof process.env.DATABASE_URL === 'undefined') {
  throw new ReferenceError('DATABASE_URL environment variable must be set');
}

// The Pool constructor does not support passing a Database URL as the
// parameter like `var client = new pg.Client(process.env.DATABASE_URL);`.

var params = url.parse(process.env.DATABASE_URL);
var auth = params.auth.split(':');
var config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
};
var pool = new pg.Pool(config);

var readQueryFile = function(query) {
  return fs.readFileSync('./sql/' + query + '.sql').toString();
};

module.exports = function(query, ...args) {
  var callback = args.pop();
  var parameters = args.pop();

  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    // TODO: Remove unused attributes
    client.query(readQueryFile(query), parameters, function(err, result) {
      done(); // release the client back to the pool

      if(err) {
        return console.error('error running query', err);
      }

      callback(err, result);
    });
  });
};
