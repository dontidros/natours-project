var mapElement = document.getElementById('map');
if (mapElement) {
  var locations = mapElement.dataset.locations;
  locations = JSON.parse(locations);

  mapboxgl.accessToken = 'pk.eyJ1IjoiZG9udGlkcm9zIiwiYSI6ImNrMjk3ZWF0eTJrd2ozYm55MHZ2aTJheXIifQ.PmIqVPMDLGPTavIDFATBhQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/dontidros/ck297sq592bdd1cp321zphy56',
    scrollZoom: false
  });

  //el.className = 'marker' - there's is a css for this with an image designed by jonas
  //anchor: 'bottom' the bottom of element will be at the exact GPS location
  //(its very logical because its a bottom of a pin)
  const bounds = new mapboxgl.LngLatBounds();
  locations.forEach(loc => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //add marker 
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    //add popup
    //offset: 30 - popup 30px up
    new mapboxgl.Popup({
        offset: 30
      })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    //extends map bounds to include current location
    bounds.extend(loc.coordinates);
  })

  //besides bound object we also give padding because we want all the markers to 
  //apear on the map on load
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
}