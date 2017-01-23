var express = require('express');
var version = require('../package.json').version;
var sql = require('../sql');

var router = express.Router();

router.get('/', function(req, res, next) {
  var bbox = (decodeURI(req.query.bbox || '-180,0,180,90')).split(',').map(Number);

  if (bbox.length != 4 || bbox.some(isNaN)) {
    return res.sendStatus(400);
  }

  sql('sites', bbox, function(err, result) {
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
    var site = result.rows[0];

    sql('dates', [sigle], function(err, result) {
      site = Object.assign(site, result.rows[0]);

      res.format({
        html: function() {
          res.render('sites', {
            version: version,
            title: 'Pollen Chart',
            site: site
          });
        },
        json: function() {
          res.json(site);
        }
      });
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
