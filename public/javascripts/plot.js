$(function() {

  var updateMap = function(site) {
    console.debug("updating map");

    $.getJSON("/api/sites/" + site, function(res) {
      //var marker = L.marker([res.latdd, res.londd]).addTo(map);

      $("#site-title").text(res.sitename + " (" + res.sigle + ")");
      $("#site-elevation").text(res.elevation);
    });
  };

  var updatePlot = function(site, limit) {
    console.debug("updating plot");

    $.getJSON("/api/sites/" + site + "/samples", function(res) {
      var taxons = { };

      res = res.sort(function(a, b) {
        return a.agebp > b.agebp;
      }).map(function(row) {
        return {
          label: row.varname,
          x: row.agebp,
          y: row.count
        };
      });

      var counts = res.reduce(function(acc, row) {
        acc[row.label] = (acc[row.label] || 0) + row.y;
        return acc;
      }, {});

      //numberOfTaxons = Object.keys(counts).length;

      var datasets = Object.keys(counts).map(function(label, i) {
        return {
          label: label,
          data: res.filter(function(row) { return row.label == label; }),
          count: counts[label]
        };
      }).sort(function(a, b) {
        return a.count < b.count;
      }).slice(0, limit).map(function(row, i) {
        return Object.assign(row, {
          fill: false,
          borderColor:          "hsla(" + i * 360 / limit + ", 50%, 60%, 0.50)",
          pointBorderColor:     "hsla(" + i * 360 / limit + ", 50%, 60%, 0.75)",
          pointBackgroundColor: "hsla(" + i * 360 / limit + ", 50%, 60%, 0.75)"
        });
      });

      var data = {
        datasets: datasets
      };

      var options = {
        animation: false,
        scales: {
          xAxes: [
            {
              type: "linear",
              position: "bottom"
            }
          ]
        }
      };

      var ctx = $("#plot");
      var plot = new Chart(ctx, {
        type: "line",
        //xAxisID: "agebp",
        //yAxisID: "count",
        data: data,
        options: options
      });
    });
  };

  var map = L.map("map", {
    center: [48, -2],
    zoom: 7
  });
  
  var layer = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '<a href="http://osm.org/copyright/">OpenStreetMap</a> contributors'
  }).addTo(map);

  var numberOfTaxons = 10; // TODO
  var site;
  var limit;

  $.getJSON("/api/sites", function(res) {
    var markers = L.markerClusterGroup({
      showCoverageOnHover: false
    });

    res.sort(function(a, b) {
      return a.sitename + a.sigle > b.sitename + b.sigle;
    }).forEach(function(row) {
      var title = row.sitename + " (" + row.sigle + ")";
      var value = row.sigle;

      $("#select-site").append(new Option(title, value));

      var marker = L.marker([row.latdd, row.londd], { icon: L.divIcon() });

      marker.on("click", function(e) {
        console.debug("click on marker '" + value + "'");
        $("#select-site").val(value);
        site = row.sigle;
        updatePlot(site, limit);
        updateMap(site);
      });

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    site = res[0].sigle; // TODO: check res.length
    limit = 1; // TODO: check number of taxons, then use checkbox

    updatePlot(site, limit);
    updateMap(site);
  });

  // TODO: Update it
  for (var i = 1; i <= numberOfTaxons; i++) { 
    $("#select-taxons").append(new Option(i, i)); 
  }

  $("#select-site").change(function() {
    site = $("#select-site").val();
    console.debug("changing site: " + site);
    updatePlot(site, limit);
    updateMap(site);
  });

  $("#select-taxons").change(function() {
    limit = $("#select-taxons").val();
    console.debug("changing limit: " + limit);
    updatePlot(site, limit);
  });
});
