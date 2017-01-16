var express = require('express');
var sql = require('../sql');

var router = express.Router();

router.get('/', function(req, res, next) {
  sql('sites', function(err, result) {
    res.json(result.rows);
  });
});

router.get('/:sigle', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();

  sql('site', [sigle], function(err, result) {
    res.json(result.rows[0]);
  });
});

router.get('/:sigle/samples', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();
  var types = (req.query.types || "herb,trsh").toUpperCase().split(",");

  sql('site_samples', [sigle, [types]], function(err, result) {
    res.json(result.rows);
  });
});

module.exports = router;
