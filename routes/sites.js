var express = require('express');
var pg = require('pg');
var url = require('url');

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

/* GET sites listing. */
router.get('/', function(req, res, next) {
  pool.connect(function(err, client, done) {
    if(err) {
      return console.error('error fetching client from pool', err);
    }
    // TODO: Remove unused attributes
    client.query(`
      SELECT DISTINCT entity.sigle, entity.entloc, entity.localveg, entity.sampdate, entity.depthatloc, entity.sampdevice, entity.corediamcm, entity.notes, descr.description, sitedesc.sitedescript, sitedesc.physiography, sitedesc.surroundveg, siteloc.sitename, siteloc.latdd, siteloc.londd, siteloc.elevation
        FROM entity, descr, sitedesc, siteloc
        WHERE
          entity.site_      = siteloc.site_ AND
          entity.site_      = sitedesc.site_ AND
          entity.descriptor = descr.descriptor
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
      SELECT DISTINCT entity.sigle, entity.entloc, entity.localveg, entity.sampdate, entity.depthatloc, entity.sampdevice, entity.corediamcm, entity.notes, descr.description, sitedesc.sitedescript, sitedesc.physiography, sitedesc.surroundveg, siteloc.sitename, siteloc.latdd, siteloc.londd, siteloc.elevation
        FROM entity, descr, sitedesc, siteloc
        WHERE
          entity.sigle    = $1 AND
          entity.site_     = siteloc.site_ AND
          entity.site_     = sitedesc.site_ AND
          entity.descriptor = descr.descriptor
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
