var map = L.map("map").setView([20, -150], 4);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18
}).addTo(map);

var segmentsLayer = L.layerGroup().addTo(map);
var markerLayer = L.layerGroup().addTo(map);
var timeChart = null;

// 1. Fonctions utilitaires

// Calcule la distance entre deux points géographiques (latitude/longitude)
// en utilisant la formule de Haversine
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Retourne une couleur pour le segment de trajectoire
// en fonction de la variable sélectionnée (vitesse ou RPM).
function getColor(value, variable) {
  if (isNaN(value)) return "gray";

  if (variable === "speed_kn") {
    if (value < 8) return "blue";
    if (value < 16) return "orange";
    return "red";
  }

  if (variable === "rpm") {
    if (value < 32) return "blue";
    if (value < 64) return "orange";
    return "red";
  }

  return "blue";
}


// 2. Fonctions interface

// Génère ou met à jour le graphique temporel
// montrant l'évolution de la variable sélectionnée.
function updateChart(labels, values, variable) {
  var ctx = document.getElementById("timeChart").getContext("2d");

  if (timeChart) timeChart.destroy();

  var labelText = variable === "speed_kn" ? "Speed" : "RPM";

  timeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: labelText,
        data: values,
        borderWidth: 2,
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { maxTicksLimit: 10 }
        },
        y: {
          beginAtZero: false
        }
      }
    }
  });
}


// 3. Fonction principale

// Fonction principale : charge les données,
// applique les filtres (navire et période),
// met à jour la carte, les KPI et le graphique.
function loadData() {
  segmentsLayer.clearLayers();
  markerLayer.clearLayers();

  var vessel = document.getElementById("vesselSelect").value;
  var variable = document.getElementById("variableSelect").value;
  var startDate = document.getElementById("startDate").value;
  var endDate = document.getElementById("endDate").value;

  var totalDistance = 0;
  var segmentCount = 0;
  var sumValues = 0;

  // Les segments sont utilisés pour l'affichage sur la carte
  // Cela permet de colorer chaque portion de trajectoire en fonction
  // de la variable sélectionnée (vitesse ou RPM)
  Papa.parse("data/trajectory_segments.csv", {
    download: true,
    header: true,
    dynamicTyping: true,

    complete: function(results) {
      var data = results.data;
      var bounds = [];

      data.forEach(function(row) {
        if (String(row.vessel_id).trim() !== vessel) return;

        var segmentStart = row.time_start ? String(row.time_start).slice(0, 10) : "";
        var segmentEnd = row.time_end ? String(row.time_end).slice(0, 10) : "";

        if (startDate && segmentStart < startDate) return;
        if (endDate && segmentEnd > endDate) return;

        var lat1 = row.lat1;
        var lon1 = row.lon1;
        var lat2 = row.lat2;
        var lon2 = row.lon2;

        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return;
        // On ignore les segments qui traversent l’antiméridien.
        // Lorsque la longitude passe de +180° à -180°, Leaflet tracerait une ligne
        // à travers toute la carte du monde, ce qui créerait un segment incorrect
        if (Math.abs(lon2 - lon1) > 180) return;

        var value = parseFloat(row[variable]);
        var color = getColor(value, variable);

        var line = L.polyline([[lat1, lon1], [lat2, lon2]], {
          color: color,
          weight: 4,
          opacity: 0.9
        });

        segmentsLayer.addLayer(line);

        var dist = haversineDistance(lat1, lon1, lat2, lon2);
        totalDistance += dist;
        segmentCount++;

        if (!isNaN(value)) sumValues += value;

        bounds.push([lat1, lon1]);
        bounds.push([lat2, lon2]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      // Les points de trajectoire sont utilisés pour l'analyse temporelle
      // et pour générer le graphique des variables (vitesse ou RPM) dans le temps
      Papa.parse("data/ships_dataset.csv", {
        download: true,
        header: true,
        dynamicTyping: true,

        complete: function(results) {
          var data = results.data;
          var labels = [];
          var values = [];
          var filteredPoints = [];

          data.forEach(function(row) {
            if (String(row.vessel_id).trim() !== vessel) return;

            var ts = row.timestamp ? String(row.timestamp).slice(0, 10) : "";

            if (startDate && ts < startDate) return;
            if (endDate && ts > endDate) return;

            var value = parseFloat(row[variable]);
            if (isNaN(value)) return;

            labels.push(row.timestamp);
            values.push(value);
            filteredPoints.push(row);
          });

          updateChart(labels, values, variable);

          if (filteredPoints.length > 0) {
            var last = filteredPoints[filteredPoints.length - 1];

            if (!isNaN(last.lat) && !isNaN(last.lon)) {
              var marker = L.circleMarker([last.lat, last.lon], {
                radius: 7,
                color: "#111827",
                fillColor: "#f97316",
                fillOpacity: 1,
                weight: 2
              });

              marker.bindPopup(
                "<b>Last position</b><br>" +
                "Navire: " + vessel + "<br>" +
                "Date: " + last.timestamp + "<br>" +
                "Lat: " + Number(last.lat).toFixed(4) + "<br>" +
                "Lon: " + Number(last.lon).toFixed(4)
              );

              markerLayer.addLayer(marker);
            }
          }

          if (labels.length > 0) {
            var start = new Date(labels[0]);
            var end = new Date(labels[labels.length - 1]);
            var durationHours = (end - start) / (1000 * 60 * 60);

            document.getElementById("kpiDuration").textContent =
              durationHours.toFixed(1) + " h";
          } else {
            document.getElementById("kpiDuration").textContent = "-";
          }

          document.getElementById("kpiDistance").textContent =
            totalDistance.toFixed(0) + " km";

          // La moyenne affichée dans le KPI dépend de la variable choisie
          // et est calculée sur la période temporelle filtrée par l'utilisateur
          var avg = segmentCount > 0 ? sumValues / segmentCount : null;
          var unit = variable === "speed_kn" ? " kn" : " rpm";

          document.getElementById("kpiAverage").textContent =
            avg !== null ? avg.toFixed(2) + unit : "-";
        },
        error: function(err) {
          console.error("Erreur PapaParse points :", err);
        }
      });
    },
    error: function(err) {
      console.error("Erreur PapaParse segments :", err);
    }
  });
}

loadData();

document.getElementById("vesselSelect").addEventListener("change", loadData);
document.getElementById("variableSelect").addEventListener("change", loadData);
document.getElementById("startDate").addEventListener("change", loadData);
document.getElementById("endDate").addEventListener("change", loadData);