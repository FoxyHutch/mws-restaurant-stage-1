let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/*Lazyload*/
var myLazyLoad = new LazyLoad();



/** 
* Register Serviceworker
*/
if('serviceWorker' in navigator) {
  navigator.serviceWorker
           .register('/sw.js', {scope: './'})
           .then(function(registration) {
             console.log("Service Worker Registered", registration); 
            })
            .catch(function(err){
              console.log("Registration failed");
            });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  myLazyLoad.update();
});

/**
 * Add Accessibility to the Mapplaceholder onclick event via eventlistener for enter.
 */
const inp = document.getElementById("map");
inp.addEventListener("keydown", function (e) {
    if (e.keyCode === 13) {  //checks whether the pressed key is "Enter"
        replaceMaps();
    }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}



function replaceMaps() {
  var googlemaps_script = document.createElement('script');
  googlemaps_script.setAttribute('src','https://maps.googleapis.com/maps/api/js?key=AIzaSyCZy_Xt2lwpvxx-lAtw2jJt3XWswiWNE2I&libraries=places&callback=initMap');
  document.head.appendChild(googlemaps_script);
}

/**
 * Initialize Google map, called from HTML.
 */
initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  // Accessibility: Replace false actions
  const mapelement = document.getElementById('map');
  mapelement.style.cursor = '';
  mapelement.onclick = function () {
    return false;
  }
  mapelement.removeAttribute('role')

  addMarkersToMap();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  /* Lazyload Images*/
  myLazyLoad.update();

  //addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  //Picture-Container
  const picture = document.createElement('picture');

  //large webP
  const sourceLargeWebP = document.createElement('source');
  sourceLargeWebP.media = '(min-width: 1000px)';
  sourceLargeWebP.type = 'image/webp';
  sourceLargeWebP.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'largeWEBP');
  sourceLargeWebP.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'largeWEBP'));

  //large image
  const sourceLarge = document.createElement('source');
  sourceLarge.media = '(min-width: 1000px)';
  sourceLarge.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'large'));

  //medium webP
  const sourceMediumWebP = document.createElement('source');
  sourceMediumWebP.media = '(min-width: 481px)';
  sourceMediumWebP.type = 'image/webp';
  sourceMediumWebP.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'mediumWEBP'));

  //medium image
  const sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 481px)';
  sourceMedium.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'medium'));

  //small webP
  const sourceSmallWebP = document.createElement('source');
  sourceSmallWebP.media = '(max-width: 480px)';
  sourceSmallWebP.type = 'image/webp';
  sourceSmallWebP.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'smallWEBP'));

  //small image
  const sourceSmall = document.createElement('source');
  sourceSmall.media = '(max-width: 480px)';
  sourceSmall.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant, 'small'));

  //fallback image
  const image = document.createElement('img');
  image.className = 'restaurant-img lazy';
  image.alt = 'Photograph of '+ restaurant.name;
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant, 'medium'));

  picture.append(sourceLargeWebP)
  picture.append(sourceLarge);
  picture.append(sourceMediumWebP)
  picture.append(sourceMedium);
  picture.append(sourceSmallWebP)
  picture.append(sourceSmall)
  picture.append(image);

  li.append(picture);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
