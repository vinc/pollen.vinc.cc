var express = require('express');
var pg = require('pg');

var router = express.Router();
var client = new pg.Client();

var config = {
  user: 'v', //env var: PGUSER
  database: 'epd', //env var: PGDATABASE
  password: '', //env var: PGPASSWORD
  host: 'localhost', // Server hosting the postgres database
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

var pool = new pg.Pool(config);

/* GET sites listing. */
router.get('/', function(req, res, next) {
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    client.query(`
      SELECT DISTINCT entity.sigle, siteloc.sitename, siteloc.latdd, siteloc.londd, siteloc.elevation
        FROM entity, siteloc
        WHERE
          entity.site_ = siteloc.site_
        ORDER BY entity.sigle
      `, function(err, result) {

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
    client.query(`
      SELECT DISTINCT entity.sigle, siteloc.sitename, siteloc.latdd, siteloc.londd, siteloc.elevation
        FROM entity, siteloc
        WHERE
          entity.sigle    = $1 AND
          entity.site_     = siteloc.site_
      `, [sigle], function(err, result) {

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
    client.query(`
      SELECT DISTINCT p_vars.varname, p_agedpt.agebp, p_counts.count, 100 * p_counts.count / sum(p_counts.count) OVER (PARTITION BY p_agedpt.agebp) AS percent
        FROM entity, p_vars, p_agedpt, p_counts, p_group
        WHERE
          entity.sigle     = $1 AND
          p_group.groupid  = ANY($2::text[]) AND
          entity.e_        = p_counts.e_ AND
          entity.e_        = p_agedpt.e_ AND
          p_vars.var_      = p_group.var_ AND
          p_vars.var_      = p_counts.var_ AND
          p_counts.sample_ = p_agedpt.sample_
        ORDER BY p_agedpt.agebp
      `, [sigle, [types]], function(err, result) {

      if(err) {
        return console.error('error running query', err);
      }

      res.json(result.rows);
      done(); // release the client back to the pool
    });
  });
});

module.exports = router;
