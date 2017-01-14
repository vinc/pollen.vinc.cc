$(function() {

  var plot = new Chart($("#plot"), {
    type: "line",
    data: {
      datasets: []
    },
    options: {
      animation: false,
      legend: {
        label: {
        }
      },
      scales: {
        xAxes: [
          {
            type: "linear",
            position: "bottom"
          }
        ]
      }
    }
  });

  var updateMap = function(site) {
    console.debug("updating map");

    $.getJSON("/api/sites/" + site, function(res) {
      //var marker = L.marker([res.latdd, res.londd]).addTo(map);

      $("#site-title").text(res.sitename + " (" + res.sigle + ")");
      $("#site-elevation").text(res.elevation);
    });
  };

  var updatePlot = function(site, types, limit) {
    console.debug("updating plot");

    var querySite = site.toLowerCase();
    var queryTypes = types.join(",").toLowerCase();
    var url = "/api/sites/" + querySite + "/samples?types=" + queryTypes;

    $.getJSON(url, function(res) {
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
          backgroundColor:      "hsla(" + i * 360 / limit + ", 50%, 60%, 0.25)",
          borderColor:          "hsla(" + i * 360 / limit + ", 50%, 60%, 0.25)",
          pointBorderColor:     "hsla(" + i * 360 / limit + ", 50%, 60%, 0.75)",
          pointBackgroundColor: "hsla(" + i * 360 / limit + ", 50%, 60%, 0.75)"
        });
      });

      plot.data.datasets = datasets;
      plot.update();
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
  var types = $("#select-types").val() || ["TRSH"];

  $("#select-types").val(types);

  $.getJSON("/api/sites", function(res) {
    var markers = L.markerClusterGroup({
      showCoverageOnHover: false
    });

    // TODO: do that server side
    res = res.sort(function(a, b) {
      return a.sitename + a.sigle > b.sitename + b.sigle;
    });

    site = res[0].sigle.toLowerCase(); // TODO: check res.length

    // Add markers on map
    res.forEach(function(row) {
      var title = row.sitename + " (" + row.sigle + ")";
      var value = row.sigle.toLowerCase();

      $("#select-site").append(new Option(title, value));

      var marker = L.marker([row.latdd, row.londd], { icon: L.divIcon() });

      marker.on("click", function(e) {
        console.debug("click on marker '" + value + "'");
        $("#select-site").val(value);
        site = row.sigle;
        updatePlot(site, types, limit);
        updateMap(site);
      });

      markers.addLayer(marker);
    });
    map.addLayer(markers);
    updateMap(site);

    $("#select-site").val(site);
    updatePlot(site, types, limit);
  });

  for (var i = 1; i <= numberOfTaxons; i++) {
    $("#select-limit").append(new Option(i, i));
  }
  limit = $("#select-limit").val() || 1;
  $("#select-limit").val(limit);

  $("#select-site").change(function() {
    site = $("#select-site").val();
    console.debug("changing site: " + site);
    updatePlot(site, types, limit);
    updateMap(site);
  });

  $("#select-limit").change(function() {
    limit = $("#select-limit").val();
    console.debug("changing limit: " + limit);
    updatePlot(site, types, limit);
  });

  $("#select-types").change(function() {
    types = $("#select-types").val();
    console.debug("changing types: " + types);
    updatePlot(site, types, limit);
  });
});
