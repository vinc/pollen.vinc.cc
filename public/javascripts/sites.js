$(function() {

  var updateSite = function(site) {
    console.debug("updating map");

    $.getJSON("/sites/" + site, function(res) {
      //var marker = L.marker([res.latdd, res.londd]).addTo(map);

      map.setView([res.latdd, res.londd], 9);

      $("#site-description").text(res.sitedescript);
      $("#site-elevation").text(res.elevation);
      $("#site-entloc").text(res.entloc);
      $("#site-notes").text(res.notes);
      $("#site-physiography").text(res.physiography);
      $("#site-sampdate").text(res.sampdate.replace("0000-00-00", ""));
      $("#site-title").text(res.sitename + " (" + res.sigle + ")");
      $("#site-vegetation").text(res.surroundveg);

      $("#site-help").hide();
      $("#site-informations").show();
    });
  };

  var updatePlot = function(site, types, limit) {
    console.debug("updating plot");

    var querySite = site.toLowerCase();
    var queryTypes = types.join(",").toLowerCase();
    var url = "/sites/" + querySite + "/samples?types=" + queryTypes;

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

      // Keep only the n taxons with the most pollen count
      var datum = Object.keys(counts).map(function(label, i) {
        return {
          key: label,
          values: res.filter(function(row) { return row.label == label; }),
          count: counts[label]
        };
      }).sort(function(a, b) {
        return a.count < b.count;
      }).slice(0, limit).map(function(row, i) {
        row.color = "hsl(" + i * 360 / limit + ", 50%, 60%)";
        return row;
      });

      nv.addGraph(function() {
        var chart = nv.models.lineChart().options({
          duration: 300,
          useInteractiveGuideline: true
        });

        chart.interpolate("monotone");

        // FIXME: only work for xAxis and not yAxis
        //chart.padData(true);
        //chart.padDataOuter(1);

        chart.margin({ "top": 10, "right": 10 });

        chart.xAxis
          .axisLabel('Year cal BP')
          .showMaxMin(false)
          .tickPadding(5)
          .tickFormat(d3.format(',r'));

        chart.yAxis
          .axisLabel('Pollen Count')
          .showMaxMin(false)
          .tickPadding(5)
          .tickFormat(d3.format(',r'));

        // Remove previous chart
        d3.select("#nvd3-container svg").remove();
        d3.select(".nvtooltip").remove();

        // Add new chart
        d3.select('#nvd3-container').append('svg')
          .datum(datum)
          .call(chart);

        //Update the chart when window resizes.
        nv.utils.windowResize(function() {
          chart.update();
        });

        return chart;
      });

      $(".chart").show();
    });
  };

  var map = L.map("map", {
    center: [47, 7],
    zoom: 4,
    zoomControl: false
  });

  map.addControl(L.control.zoom({
    position: "topright"
  }));

  var layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '<a href="http://osm.org/copyright/">OpenStreetMap</a>'
  }).addTo(map);

  var numberOfTaxons = 10; // TODO
  var site;
  var limit;
  var types = $("#select-types").val() || ["TRSH"];

  $("#select-types").val(types);

  $.getJSON("/sites", function(res) {
    var markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
    });

    // TODO: do that server side
    res = res.sort(function(a, b) {
      return a.sitename + a.sigle > b.sitename + b.sigle;
    });

    // Add markers on map
    res.forEach(function(row) {
      var title = row.sitename + " (" + row.sigle + ")";
      var value = row.sigle.toLowerCase();

      $("#select-site").append(new Option(title, value));

      var marker = L.marker([row.latdd, row.londd], {
        icon: L.divIcon({
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      });

      marker.on("click", function(e) {
        console.debug("click on marker '" + value + "'");
        $("#select-site").val(value);
        site = row.sigle;
        updatePlot(site, types, limit);
        updateSite(site);
      });

      markers.addLayer(marker);
    });
    map.addLayer(markers);
  });

  for (var i = 1; i <= numberOfTaxons; i++) {
    $("#select-limit").append(new Option(i, i));
  }
  limit = $("#select-limit").val() || 2;
  $("#select-limit").val(limit);

  $("#select-site").change(function() {
    site = $("#select-site").val();
    console.debug("changing site: " + site);
    updatePlot(site, types, limit);
    updateSite(site);
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
