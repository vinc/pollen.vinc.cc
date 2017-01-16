var express = require('express');
var pg = require('pg');
var url = require('url');

var sql = require('../sql');

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

var router = express.Router();

router.get('/', function(req, res, next) {
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    // TODO: Remove unused attributes
    client.query(sql('sites'), function(err, result) {

      if(err) {
        return console.error('error running query', err);
      }

      res.json(result.rows);
      done(); // release the client back to the pool
    });
  });
});

router.get('/:sigle', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();

  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query(sql('site'), [sigle], function(err, result) {

      if(err) {
        return console.error('error running query', err);
      }

      res.json(result.rows[0]);
      done(); // release the client back to the pool
    });
  });
});

router.get('/:sigle/samples', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();
  var types = (req.query.types || "herb,trsh").toUpperCase().split(",");

  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query(sql('site_samples'), [sigle, [types]], function(err, result) {

      if(err) {
        return console.error('error running query', err);
      }

      res.json(result.rows);
      done(); // release the client back to the pool
    });
  });
});

module.exports = router;
