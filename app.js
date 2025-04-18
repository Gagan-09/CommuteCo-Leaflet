// Nominatim Search API

const carIcon = L.icon({
  iconUrl:
    "https://media-hosting.imagekit.io/ec5c2d35d1e640e8/logo.png?Expires=1839018053&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F1mDXmZbHD8NrL00tDuenHN5FwVEqW~OF1Thlz6FdtxIjqYB10RA~-hYEIhSz2Z9NVDiMwUogJ0-PAKINZTAaw~zHR1CYA~qOkHCBCLCTKPn3f6GOEwoZhuj8yaj3-tJzK~OjjcTMx04xDFBDruEVU-8nxc6x9QXxWZw0M8HDAw6nN0E5vG8lc1qA88vao4TgAjDgIozXkWn82yXZ01sWuq4Zy9ZVcGPHSpOTQCqnaGTqsyd2Amf5IXY6DU-J~ub5P4Vw5L0ilhpgSI2U-emgii~Tbv4QTpyslfPxpmLWATUBLh7y3Ma51WjaoSu2DnXX5u0gcTZm8WwyVMmoYiN5A",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -30],
});

document.addEventListener("DOMContentLoaded", function () {
  const map = L.map("map").setView([12.971599, 77.594566], 12.5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let srcMarker = null;
  let destMarker = null;
  let routingControl = null;
  let setting = "source";
  let userMarker = null;
  let watchId = null;

  function drawRoute(srcLatLng, destLatLng) {
    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(srcLatLng[0], srcLatLng[1]),
        L.latLng(destLatLng[0], destLatLng[1]),
      ],
      routeWhileDragging: false,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      createMarker: function (i, wp) {
        const markerOptions = {};
        if (i === 0) {
          markerOptions.icon = carIcon;
          return L.marker(wp.latLng, markerOptions).bindPopup("Source");
        } else {
          return L.marker(wp.latLng, markerOptions).bindPopup("Destination");
        }
      },
    })
      .on("routesfound", function (e) {
        const route = e.routes[0];
        const distanceInKm = (route.summary.totalDistance / 1000).toFixed(2);
        const fare = Math.round(distanceInKm * 9);

        // Update summary
        document.getElementById("summary-distance").textContent = distanceInKm;
        document.getElementById("summary-fare").textContent = fare;

        const destMarker = routingControl.getPlan()._markers[1];
        if (destMarker) {
          destMarker
            .bindPopup(`Destination<br>🚗 ${distanceInKm} km<br>💰 ₹${fare}`)
            .openPopup();
        }
      })
      .addTo(map);
  }

  map.on("click", function (e) {
    const { lat, lng } = e.latlng;

    if (setting === "source") {
      document.getElementById("src-lat").value = lat.toFixed(6);
      document.getElementById("src-lng").value = lng.toFixed(6);
      document.getElementById("summary-src").textContent = `${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;

      if (srcMarker) map.removeLayer(srcMarker);
      srcMarker = L.marker([lat, lng], { icon: carIcon })
        .addTo(map)
        .bindPopup("Source")
        .openPopup();
    } else {
      document.getElementById("dest-lat").value = lat.toFixed(6);
      document.getElementById("dest-lng").value = lng.toFixed(6);
      document.getElementById("summary-dest").textContent = `${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;

      if (destMarker) map.removeLayer(destMarker);
      destMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup("Destination")
        .openPopup();

      const srcLat = parseFloat(document.getElementById("src-lat").value);
      const srcLng = parseFloat(document.getElementById("src-lng").value);
      if (!isNaN(srcLat) && !isNaN(srcLng)) {
        drawRoute([srcLat, srcLng], [lat, lng]);
      }
    }
  });

  document.getElementById("set-coords").addEventListener("click", setRoute);

  function setRoute() {
    const srcLat = parseFloat(document.getElementById("src-lat").value);
    const srcLng = parseFloat(document.getElementById("src-lng").value);
    const destLat = parseFloat(document.getElementById("dest-lat").value);
    const destLng = parseFloat(document.getElementById("dest-lng").value);

    if ([srcLat, srcLng, destLat, destLng].some(isNaN)) {
      alert("Please enter valid coordinates.");
      return;
    }

    // Update summary
    document.getElementById("summary-src").textContent = `${srcLat.toFixed(
      6
    )}, ${srcLng.toFixed(6)}`;
    document.getElementById("summary-dest").textContent = `${destLat.toFixed(
      6
    )}, ${destLng.toFixed(6)}`;

    const srcLatLng = [srcLat, srcLng];
    const destLatLng = [destLat, destLng];

    if (srcMarker) map.removeLayer(srcMarker);
    if (destMarker) map.removeLayer(destMarker);

    srcMarker = L.marker(srcLatLng, { icon: carIcon })
      .addTo(map)
      .bindPopup("Source")
      .openPopup();
    destMarker = L.marker(destLatLng)
      .addTo(map)
      .bindPopup("Destination")
      .openPopup();

    drawRoute(srcLatLng, destLatLng);
  }

  document.getElementById("clear").addEventListener("click", function () {
    if (srcMarker) map.removeLayer(srcMarker);
    if (destMarker) map.removeLayer(destMarker);
    if (routingControl) map.removeControl(routingControl);
    if (userMarker) map.removeLayer(userMarker);
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);

    srcMarker = destMarker = routingControl = userMarker = null;
    watchId = null;

    document.getElementById("src-lat").value = "";
    document.getElementById("src-lng").value = "";
    document.getElementById("dest-lat").value = "";
    document.getElementById("dest-lng").value = "";
    document.getElementById("summary-src").textContent = "-";
    document.getElementById("summary-dest").textContent = "-";
    document.getElementById("summary-distance").textContent = "-";
    document.getElementById("summary-fare").textContent = "-";

    map.setView([12.971599, 77.594566], 12.5);
  });

  document.addEventListener("keydown", function (e) {
    const key = e.key.toLowerCase();
    if (key === "s") setting = "source";
    if (key === "d") setting = "destination";
    if (key === "f") document.getElementById("set-coords").click();
    if (key === "c") document.getElementById("clear").click();
    if (key === "t") startLiveTracking();
    if (key === "x") stopLiveTracking();
  });

  function startLiveTracking() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        document.getElementById("src-lat").value = lat.toFixed(6);
        document.getElementById("src-lng").value = lng.toFixed(6);
        document.getElementById("summary-src").textContent = `${lat.toFixed(
          6
        )}, ${lng.toFixed(6)}`;

        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], { icon: carIcon })
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();
        }

        map.setView([lat, lng], 14);
        if (srcMarker) map.removeLayer(srcMarker);
        srcMarker = L.marker([lat, lng], { icon: carIcon })
          .addTo(map)
          .bindPopup("Source")
          .openPopup();
        setting = "destination";

        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      },
      function (err) {
        console.error("Error watching position:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  }

  function stopLiveTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    document.getElementById("src-lat").value = "";
    document.getElementById("src-lng").value = "";
    document.getElementById("summary-src").textContent = "-";
  }

  async function getLatLngFromPlace(place) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      place
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } else {
      throw new Error("Location not found");
    }
  }

  document
    .getElementById("search-places")
    ?.addEventListener("click", async function () {
      const srcPlace = document.getElementById("src-place")?.value;
      const destPlace = document.getElementById("dest-place")?.value;

      if (!srcPlace || !destPlace) {
        alert("Please enter both source and destination localities.");
        return;
      }

      try {
        const srcCoords = await getLatLngFromPlace(srcPlace);
        const destCoords = await getLatLngFromPlace(destPlace);

        document.getElementById("src-lat").value = srcCoords.lat.toFixed(6);
        document.getElementById("src-lng").value = srcCoords.lng.toFixed(6);
        document.getElementById("dest-lat").value = destCoords.lat.toFixed(6);
        document.getElementById("dest-lng").value = destCoords.lng.toFixed(6);

        document.getElementById(
          "summary-src"
        ).textContent = `${srcCoords.lat.toFixed(6)}, ${srcCoords.lng.toFixed(
          6
        )}`;
        document.getElementById(
          "summary-dest"
        ).textContent = `${destCoords.lat.toFixed(6)}, ${destCoords.lng.toFixed(
          6
        )}`;

        if (srcMarker) map.removeLayer(srcMarker);
        if (destMarker) map.removeLayer(destMarker);

        srcMarker = L.marker([srcCoords.lat, srcCoords.lng], { icon: carIcon })
          .addTo(map)
          .bindPopup("Source")
          .openPopup();
        destMarker = L.marker([destCoords.lat, destCoords.lng])
          .addTo(map)
          .bindPopup("Destination")
          .openPopup();

        drawRoute(
          [srcCoords.lat, srcCoords.lng],
          [destCoords.lat, destCoords.lng]
        );
      } catch (err) {
        alert("One or both locations could not be found.");
        console.error(err);
      }
    });

  document
    .getElementById("back-to-passenger-btn")
    .addEventListener("click", function () {
      window.location.href = "../passengerpanel.html";
    });
  document.getElementById("book-ride-btn").addEventListener("click", () => {
    const srcLat = document.getElementById("src-lat").value;
    const srcLng = document.getElementById("src-lng").value;
    const destLat = document.getElementById("dest-lat").value;
    const destLng = document.getElementById("dest-lng").value;

    if (!srcLat || !srcLng || !destLat || !destLng) {
      alert("❌ Please set both source and destination before booking a ride.");
      return;
    }

    const lottieContainer = document.getElementById("lottie-container");
    const bookRideBtn = document.getElementById("book-ride-btn");
    const appContainer = document.getElementById("app");

    // Hide Book button
    bookRideBtn.style.display = "none";

    // Show animation and blur
    appContainer.classList.add("blur");
    lottieContainer.style.display = "flex";

    // Load Lottie animation
    const animation = lottie.loadAnimation({
      container: lottieContainer,
      renderer: "svg",
      loop: false,
      autoplay: true,
      path: "/animations/ride-booked.json",
    });

    setTimeout(() => {
      lottieContainer.style.display = "none";
      appContainer.classList.remove("blur");
      alert("✅ Ride successfully booked!");
      window.location.href = "../passengerpanel.html";
    }, 2500);
  });
});
