const carIcon = L.icon({
    iconUrl: 'https://media-hosting.imagekit.io/ec5c2d35d1e640e8/logo.png?Expires=1839018053&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F1mDXmZbHD8NrL00tDuenHN5FwVEqW~OF1Thlz6FdtxIjqYB10RA~-hYEIhSz2Z9NVDiMwUogJ0-PAKINZTAaw~zHR1CYA~qOkHCBCLCTKPn3f6GOEwoZhuj8yaj3-tJzK~OjjcTMx04xDFBDruEVU-8nxc6x9QXxWZw0M8HDAw6nN0E5vG8lc1qA88vao4TgAjDgIozXkWn82yXZ01sWuq4Zy9ZVcGPHSpOTQCqnaGTqsyd2Amf5IXY6DU-J~ub5P4Vw5L0ilhpgSI2U-emgii~Tbv4QTpyslfPxpmLWATUBLh7y3Ma51WjaoSu2DnXX5u0gcTZm8WwyVMmoYiN5A',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30]
  });
  
  document.addEventListener('DOMContentLoaded', function () {
    const map = L.map('map').setView([12.971599, 77.594566], 12.5);
  
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  
    let srcMarker = null;
    let destMarker = null;
    let routingControl = null;
    let setting = 'source';
    let userMarker = null;
    let watchId = null;
  
    function drawRoute(srcLatLng, destLatLng) {
      if (routingControl) map.removeControl(routingControl);
  
      routingControl = L.Routing.control({
        waypoints: [L.latLng(srcLatLng[0], srcLatLng[1]), L.latLng(destLatLng[0], destLatLng[1])],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        createMarker: function (i, wp) {
          return L.marker(wp.latLng, { icon: i === 0 ? carIcon : undefined })
            .bindPopup(i === 0 ? "Source" : "Destination");
        }
      }).addTo(map);
    }
  
    map.on('click', function (e) {
      const { lat, lng } = e.latlng;
  
      if (setting === 'source') {
        document.getElementById('src-lat').value = lat.toFixed(6);
        document.getElementById('src-lng').value = lng.toFixed(6);
        if (srcMarker) map.removeLayer(srcMarker);
        srcMarker = L.marker([lat, lng], { icon: carIcon }).addTo(map).bindPopup("Source").openPopup();
      } else {
        document.getElementById('dest-lat').value = lat.toFixed(6);
        document.getElementById('dest-lng').value = lng.toFixed(6);
        if (destMarker) map.removeLayer(destMarker);
        destMarker = L.marker([lat, lng]).addTo(map).bindPopup("Destination").openPopup();
      }
    });
  
    document.getElementById('set-coords').addEventListener('click', setRoute);
  
    function setRoute() {
      const srcLat = parseFloat(document.getElementById('src-lat').value);
      const srcLng = parseFloat(document.getElementById('src-lng').value);
      const destLat = parseFloat(document.getElementById('dest-lat').value);
      const destLng = parseFloat(document.getElementById('dest-lng').value);
  
      if ([srcLat, srcLng, destLat, destLng].some(isNaN)) {
        alert('Please enter valid coordinates.');
        return;
      }
  
      const srcLatLng = [srcLat, srcLng];
      const destLatLng = [destLat, destLng];
  
      if (srcMarker) map.removeLayer(srcMarker);
      if (destMarker) map.removeLayer(destMarker);
  
      srcMarker = L.marker(srcLatLng, { icon: carIcon }).addTo(map).bindPopup("Source").openPopup();
      destMarker = L.marker(destLatLng).addTo(map).bindPopup("Destination").openPopup();
  
      drawRoute(srcLatLng, destLatLng);
    }
  
    document.getElementById('clear').addEventListener('click', function () {
      if (srcMarker) map.removeLayer(srcMarker);
      if (destMarker) map.removeLayer(destMarker);
      if (routingControl) map.removeControl(routingControl);
      if (userMarker) map.removeLayer(userMarker);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  
      srcMarker = destMarker = routingControl = userMarker = null;
      watchId = null;
  
      document.getElementById('src-lat').value = '';
      document.getElementById('src-lng').value = '';
      document.getElementById('dest-lat').value = '';
      document.getElementById('dest-lng').value = '';
    });
  
    document.addEventListener('keydown', function (e) {
      const key = e.key.toLowerCase();
      if (key === 's') setting = 'source';
      if (key === 'd') setting = 'destination';
      if (key === 'f') document.getElementById('set-coords').click();
      if (key === 'c') document.getElementById('clear').click();
      if (key === 't') startLiveTracking();
      if (key === 'x') stopLiveTracking();
      if (key === 'r') document.getElementById('search-places')?.click();
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
  
          document.getElementById('src-lat').value = lat.toFixed(6);
          document.getElementById('src-lng').value = lng.toFixed(6);
  
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            userMarker = L.marker([lat, lng], { icon: carIcon }).addTo(map).bindPopup("You are here").openPopup();
          }
  
          map.setView([lat, lng], 14);
        },
        function (err) {
          console.error("Error watching position:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
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
      document.getElementById('src-lat').value = '';
      document.getElementById('src-lng').value = '';
    }
  
    // --------- LOCALITY TO COORDINATES (GEOCODING) --------
    async function getLatLngFromPlace(place) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } else {
        throw new Error("Location not found");
      }
    }
  
    document.getElementById('search-places')?.addEventListener('click', async function () {
      const srcPlace = document.getElementById('src-place')?.value;
      const destPlace = document.getElementById('dest-place')?.value;
  
      if (!srcPlace || !destPlace) {
        alert('Please enter both source and destination localities.');
        return;
      }
  
      try {
        const srcCoords = await getLatLngFromPlace(srcPlace);
        const destCoords = await getLatLngFromPlace(destPlace);
  
        document.getElementById('src-lat').value = srcCoords.lat.toFixed(6);
        document.getElementById('src-lng').value = srcCoords.lng.toFixed(6);
        document.getElementById('dest-lat').value = destCoords.lat.toFixed(6);
        document.getElementById('dest-lng').value = destCoords.lng.toFixed(6);
  
        if (srcMarker) map.removeLayer(srcMarker);
        if (destMarker) map.removeLayer(destMarker);
  
        srcMarker = L.marker([srcCoords.lat, srcCoords.lng], { icon: carIcon }).addTo(map).bindPopup("Source").openPopup();
        destMarker = L.marker([destCoords.lat, destCoords.lng]).addTo(map).bindPopup("Destination").openPopup();
  
        drawRoute([srcCoords.lat, srcCoords.lng], [destCoords.lat, destCoords.lng]);
      } catch (err) {
        alert("One or both locations could not be found.");
        console.error(err);
      }
    });
  });
  