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

var createMarkers = function(sites, { onClick: onClickCallback }) {
  var group = L.markerClusterGroup({
    showCoverageOnHover: false,
    //chunkedLoading: true, // FIXME bug if map.setView() is called at the same time
  });

  // Add markers on map
  var markers = sites.map(function(site) {
    var marker = L.marker([site.latdd, site.londd], {
      title: site.sigle,
      icon: L.divIcon({
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    });

    if (onClickCallback) {
      marker.on("click", function(e) {
        onClickCallback(site);
      });
    }

    return marker;
  });

  group.addLayers(markers);

  return group;
};

var fetchSamples = function({ sigle, types, limit }, callback) {
  var querySite = sigle.toLowerCase();
  var queryTypes = types.join(",").toLowerCase();
  var path = "/sites/" + querySite + "/samples?types=" + queryTypes;

  Vue.http.get(path).then(response => {
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
        _count: counts[varname]
      };
    }).sort(function(a, b) {
      return b._count - a._count;
    }).slice(0, limit).map(function(row, i) {
      row.color = "hsl(" + i * 360 / limit + ", 50%, 60%)";
      row.values = row.values.map(function(value) {
        return { x: value.agebp, y: value.count };
      });
      return row;
    });
    callback(null, datum);
  });
};

/*
 * var datum = [
 *   {
 *     key: "Quercus", // Taxon name
 *     color: "hsl(0, 50%, 60%),
 *     values: [
 *       { x: 1000, y: 42 }, // `x` is 'Year cal BP'; `y` is 'Pollen Count'
 *       { x: 2000, y: 25 },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 *
 */
var createChart = function(datum) {
  nv.addGraph(function() {
    var chart = nv.models.lineChart().options({
      duration: 300,
      useInteractiveGuideline: true
    });

    chart.interpolate("linear");

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
};

var destroyChart = function() {
  d3.selectAll("#nvd3-container svg").remove();
  d3.selectAll(".nvtooltip").remove();
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

var router = new VueRouter({
  mode: "history",
  routes: [
    {
      name: "sites",
      path: "/sites"
    },
    {
      name: "site",
      path: "/sites/:sigle"
    }
  ]
});

var vue = new Vue({
  el: "#app",
  router: router,
  data: {
    loading: false,
    clickedMarker: false,
    selectSite: "",
    selectTypes: ["TRSH"],
    selectLimit: 3,
    sites: [],
    site: null
  },
  created: function() {
    if (this.$route.name == "site") {
      this.loading = true;
    }
  },
  mounted: function() { // Leaflet requires `mounted` instead of `created`
    this.map = createMap(); // TODO: Create map later to avoid `setView()`

    this.$http.get("/sites").then(response => {
      return response.json();
    }).then(json => {
      this.sites = json;

      var vm = this;
      var markers = createMarkers(json, {
        onClick: function(site) {
          vm.selectSite = site.sigle;
          vm.clickedMarker = true;
        }
      });

      this.map.addLayer(markers);
      if (this.$route.name == "site") {
        this.selectSite = this.$route.params.sigle.toUpperCase();
      } // TODO: Create map in else case and below in place of setView
    });
  },
  watch: {
    selectSite: function(newSite) {
      var path = "/sites/" + newSite.toLowerCase();
      this.loading = true;
      this.$http.get(path).then(response => {
        return response.json();
      }).then(json => {
        this.loading = false;
        router.push(path);
        this.site = json;

        if (!this.clickedMarker) {
          // FIXME: setView() will cause a bug when chunkedLoading of markers is true
          this.map.setView([json.latdd, json.londd], 9);
        }
        this.clickedMarker = false;

        this.updateChart();
      });
    },
    selectTypes: function(newTypes) {
      if (this.site) {
        this.updateChart();
      }
    },
    selectLimit: function(newLimit) {
      if (this.site) {
        this.updateChart();
      }
    }
  },
  methods: {
    updateChart() {
      destroyChart();
      var params = {
        sigle: this.selectSite,
        types: this.selectTypes,
        limit: this.selectLimit
      };
      fetchSamples(params, function(err, samples) {
        createChart(samples);
      });
    }
  }
});
