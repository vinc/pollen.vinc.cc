var express = require('express');
var version = require('../package.json').version;
var sql = require('../sql');

var router = express.Router();

router.get('/', function(req, res, next) {
  sql('sites', function(err, result) {
    res.format({
      html: function() {
        res.render('sites', {
          version: version,
          title: 'Pollen Chart'
        });
      },
      json: function() {
        res.json(result.rows);
      }
    });
  });
});

router.get('/:sigle', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();

  sql('site', [sigle], function(err, result) {
    res.format({
      html: function() {
        res.render('sites', {
          version: version,
          title: 'Pollen Chart',
          site: result.rows[0]
        });
      },
      json: function() {
        res.json(result.rows[0]);
      }
    });
  });
});

router.get('/:sigle/samples', function(req, res, next) {
  var sigle = req.params.sigle.toUpperCase();
  var types = (req.query.types || "herb,trsh").toUpperCase().split(",");

  sql('site_samples', [sigle, [types]], function(err, result) {
    res.format({
      html: function() {
        res.render('sites', {
          version: version,
          title: 'Pollen Chart'
        });
      },
      json: function() {
        res.json(result.rows);
      }
    });
  });
});

module.exports = router;
