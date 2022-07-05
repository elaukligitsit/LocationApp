// This example requires the Geometry library. Include the libraries=geometry
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry">

let map, infoWindow;

function initMap() {

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.01653181667754, lng: -105.27106134717665},
    zoom: 17,
  });
  const triangleCoords = [
    { lat: 40.01686038103379, lng: -105.27159332604752},
    { lat: 40.015930539809276, lng: -105.27155471467788},
    { lat: 40.01653838798017, lng: -105.27010893339173},
  ];

  const homeTriangle = new google.maps.Polygon({ paths: triangleCoords });

  const triangleCoordsShape = [
    { lat: 40.01686038103379, lng: -105.27159332604752},
    { lat: 40.015930539809276, lng: -105.27155471467788},
    { lat: 40.01653838798017, lng: -105.27010893339173},
    { lat: 40.01686038103379, lng: -105.27159332604752},
  ];
  // Construct the polygon.
  const homeTriangleShape = new google.maps.Polygon({
    paths: triangleCoordsShape,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.05,
  });

  homeTriangleShape.setMap(map);
  infoWindow = new google.maps.InfoWindow();

  const locationButton = document.createElement("button");

  locationButton.textContent = "Engineer?";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          infoWindow.setPosition(pos);
          infoWindow.open(map);
          map.setCenter(pos);
          infoWindow.setContent("Using ContLoc Wrong");
          if (google.maps.geometry.poly.containsLocation(pos, homeTriangle)){
            infoWindow.setContent("You are an Engineering Student");
            console.log("position found but u sux1");
          }
          else {
            infoWindow.setContent("You are Pleb");
            console.log("position found but u sux2");
          }
          
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}


