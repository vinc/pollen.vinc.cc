var createMap = function() {
  return L.map("map", {
    center: [47, 7],
    zoom: 4,
    zoomControl: false
  }).addControl(L.control.zoom({
    position: "topright"
  })).addLayer(L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '<a href="http://osm.org/copyright/">OpenStreetMap</a>'
  }));
};

var createMarkers = function(sites) {
  var markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    chunkedLoading: true,
  });

  // Add markers on map
  sites.forEach(function(site) {
    var marker = L.marker([site.latdd, site.londd], {
      icon: L.divIcon({
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    });

    marker.on("click", function(e) {
      vue.selectSite = site.sigle;
    });

    markers.addLayer(marker);
  });

  return markers;
};

var createChart = function(site, types, limit) {
  var querySite = site.toLowerCase();
  var queryTypes = types.join(",").toLowerCase();
  var url = "/sites/" + querySite + "/samples?types=" + queryTypes;

  Vue.http.get(url).then(response => {
    return response.json();
  }).then(json => {
    var counts = json.reduce(function(acc, row) {
      acc[row.varname] = (acc[row.varname] || 0) + row.count;
      return acc;
    }, {});

    // Keep only the n taxons with the most pollen count
    var datum = Object.keys(counts).map(function(varname, i) {
      return {
        key: varname,
        values: json.filter(function(row) { return row.varname == varname; }),
        count: counts[varname]
      };
    }).sort(function(a, b) {
      return b.count - a.count;
    }).slice(0, limit).map(function(row, i) {
      row.color = "hsl(" + i * 360 / limit + ", 50%, 60%)";
      row.values = row.values.map(function(value) {
        return { x: value.agebp, y: value.count };
      });
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
  });
};

Vue.component("site-info", function (resolve, reject) {
  Vue.http.get("/partials/sites/info.hbs").then(response => {
    return response.text();
  }).then(text => {
    resolve({
      template: text,
      props: ["site"]
    });
  });
});

var vue = new Vue({
  el: "#app",
  data: {
    selectSite: "",
    selectTypes: ["TRSH"],
    selectLimit: 3,
    sites: [],
    site: undefined
  },
  created: function() {
  },
  mounted: function() {
    this.map = createMap();

    this.$http.get("/sites").then(response => {
      return response.json();
    }).then(json => {
      this.sites = json;
      this.map.addLayer(createMarkers(this.sites));
    });
  },
  watch: {
    selectSite: function(newSite) {
      this.selectSite = newSite;

      this.$http.get("/sites/" + newSite.toLowerCase()).then(response => {
        return response.json();
      }).then(json => {
        this.site = json;
        this.map.setView([json.latdd, json.londd], 9);
        createChart(this.selectSite, this.selectTypes, this.selectLimit);
      });
    },
    selectTypes: function(newTypes) {
      if (this.site) {
        createChart(this.selectSite, this.selectTypes, this.selectLimit);
      }
    },
    selectLimit: function(newLimit) {
      if (this.site) {
        createChart(this.selectSite, this.selectTypes, this.selectLimit);
      }
    }
  }
});
