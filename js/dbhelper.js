/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANT_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

   /**
     * Reviews URL
     */
    static get REVIEWS_URL() {
      const port = 1337 // Change this to your server port
      return `http://localhost:${port}/reviews`;
    }


    static openDatabase() {
      // If the browser doesn't support service worker,
      // there is no need for idb
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }
  
      return idb.open('restaurant-db', 2, function (upgradeDb) {
        switch (upgradeDb.oldVersion) {
          case 0:
            upgradeDb.createObjectStore('restaurants', {
              keyPath: 'id'
            });
          case 1:
            upgradeDb.createObjectStore('reviews', {
              keyPath: 'id'
            });
        }
  
      });
    }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    DBHelper.openDatabase().then(function (db) {
      if (!db) return;

      let tx = db.transaction('restaurants', 'readwrite');
      let store = tx.objectStore('restaurants');

      store.getAll().then(function (items) {
        // Not items in DB => fetch
        if (items.length < 1) {

          console.log("1. fetchRestaurants: No items in DB, fetch")
          //fetch API
          fetch(DBHelper.RESTAURANT_URL, {
            method: 'GET'
          })
          .then(response => {
            if(response.ok) {
              return response.json()
            }else{
              const error = (`Request failed. Returned status of ${response.status}`);
              callback(error, null);
            }})
          .then(function(response){
            let tx = db.transaction('restaurants', 'readwrite');
            let store = tx.objectStore('restaurants');
            response.forEach(function(restaurant){
              store.put(restaurant);
            })
            return response;
          })
          .then(response => callback(null, response))
          .catch(err => console.log(err))

        } else {

          //items in DB => fetch after serving from db
          
          callback(null, items);
          console.log("2.1 fetchRestaurants: items in DB, fetch from DB")

          fetch(DBHelper.RESTAURANT_URL, {
            method: 'GET'
          })
          .then(response => {
            if(response.ok) {
              return response.json()
            }else{
              const error = (`Request failed. Returned status of ${response.status}`);
              console.log(error);
            }})
          .then(function(response){
            let tx = db.transaction('restaurants', 'readwrite');
            let store = tx.objectStore('restaurants');
            response.forEach(function(restaurant){
              store.put(restaurant);
            })
           
          })
          .catch(err => console.log(err))
          console.log("2.2 fetchRestaurants: update DB")
        }
      })
    })}


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  static fetchReviewByRestaurantId(restaurantId, callback) {
    //construct URL
    const reviewURL = `${DBHelper.REVIEWS_URL}/?restaurant_id=${restaurantId}`
    fetch(reviewURL ,{
      method: 'GET'
    })
    .then(response => {
      if(response.ok) {
        return response.json()
      }else{
        const error = (`Request failed. Returned status of ${response.status}`);
        callback(error, null);
      }})
      .then(response => callback(null, response))
      .catch(err => console.error(err))
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL .
   */
  static imageUrlForRestaurant(restaurant, size) {
    if (restaurant.photograph == null) {
      return ('/img/img_placeholder.svg');
    } else {
      switch (size) {
        case 'small':
          return (`/img/${restaurant.photograph}_small.jpg`);
          break;
        case 'smallWEBP':
          return (`/img/${restaurant.photograph}_small.webp`);
          break;
        case 'medium':
          return (`/img/${restaurant.photograph}_medium.jpg`);
          break;
        case 'mediumWEBP':
          return (`/img/${restaurant.photograph}_medium.webp`);
          break;
        case 'large':
          return (`/img/${restaurant.photograph}_large.jpg`);
          break;
        case 'largeWEBP':
          return (`/img/${restaurant.photograph}_large.webp`);
          break;
        default:
          return (`/img/${restaurant.photograph}_medium.jpg`);
          break;
      }
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}
