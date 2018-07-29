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

  static databaseSetup() {
    return idb.open('restaurant-db', 3, function (upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore('restaurants', {
            keyPath: 'id'
          });
        case 1:
          upgradeDb.createObjectStore('reviews', {
            keyPath: 'id', autoIncrement: true
          });
        case 2:
          upgradeDb.createObjectStore('tempreviews', {
            keyPath: 'id', autoIncrement: true
          })
      }

    });
  }


  static openDatabase() {
    // If the browser doesn't support service worker,
    // there is no need for idb
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return DBHelper.databaseSetup();
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
              if (response.ok) {
                return response.json()
              } else {
                const error = (`Request failed. Returned status of ${response.status}`);
                callback(error, null);
              }
            })
            .then(function (response) {
              let tx = db.transaction('restaurants', 'readwrite');
              let store = tx.objectStore('restaurants');
              response.forEach(function (restaurant) {
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
              if (response.ok) {
                return response.json()
              } else {
                const error = (`Request failed. Returned status of ${response.status}`);
                console.log(error);
              }
            })
            .then(function (response) {
              let tx = db.transaction('restaurants', 'readwrite');
              let store = tx.objectStore('restaurants');
              response.forEach(function (restaurant) {
                store.put(restaurant);
              })

            })
            .catch(err => console.log(err))
          console.log("2.2 fetchRestaurants: update DB")
        }
      })
    })
  }


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



  static fetchReviewsForDBSync() {
    return new Promise(function (resolve, reject) {
      // open DB without openDatabase function because of problems with direct calls from serviceWorker
      DBHelper.databaseSetup()
        .then(function (db) {
          if (!db) {
            const err = 'No DB found'
            reject(err);
          } else {
            let tx = db.transaction('tempreviews', 'readwrite');
            let store = tx.objectStore('tempreviews');
            return store.getAll();
          }
        })
        .then(function (reviews) {
          resolve(reviews);
        })
    }
    )
  }

  static deleteReviewAfterPOST(review_id) {
    return new Promise(function (resolve, reject) {
      // open DB without openDatabase function because of problems with direct calls from serviceWorker
      DBHelper.databaseSetup()
        .then(function (db) {
          if (!db) {
            const err = 'No DB found'
            reject(err);
          } else {

            // Check IDB
            let tx = db.transaction('tempreviews', 'readwrite');
            let store = tx.objectStore('tempreviews');

            store.delete(review_id);
          }
        }).then(function () {
          resolve('Successfully Deleted')
        })
    })
  }


  // Fetch and store to given restaurantID
  static fetchReviewByRestaurantId(restaurantId) {
    return new Promise(function (resolve, reject) {
      DBHelper.openDatabase().then(function (db) {
        if (!db) {
          const err = 'No DB found'
          reject(err);
        } else {

          let tx = db.transaction('reviews', 'readwrite');
          let store = tx.objectStore('reviews');

          store.getAll()
            .then(function (items) {
              let reviews = items.filter(item => item.restaurant_id == restaurantId)
              if (reviews.length > 1) {
                // Return items from db and fetch afterwards

                // Return items with given restaurant ID
                //resolve(items)
                resolve(reviews)
              }

              const reviewURL = `${DBHelper.REVIEWS_URL}/?restaurant_id=${restaurantId}`;

              fetch(reviewURL, {
                method: 'GET'
              })
                .then(response => {
                  if (response.ok) {
                    return response.json()
                  } else {
                    const err = (`Request failed. Returned status of ${response.status}`);
                    reject(err);
                  }
                })
                .then(response => {
                  let tx = db.transaction('reviews', 'readwrite');
                  let store = tx.objectStore('reviews');
                  response.forEach(function (review) {
                    store.put(review);
                  })
                  return response;
                })
                .then(response => resolve(response))
                .catch(reject => reject('Error while catching')
                )

            })
        }
      })
    })
  }

  static changeRestaurantFavorite(restaurant) {
    return new Promise(function (resolve, reject) {

      const newIsFavorite = !(restaurant.is_favorite == 'true');
      const favoriteURL = `${DBHelper.RESTAURANT_URL}/${restaurant.id}/?is_favorite=${newIsFavorite}`

      fetch(favoriteURL, {
        method: 'PUT'
      })
        .then(response => {
          if (response.ok) {
            resolve(newIsFavorite);
          } else {
            const err = (`Request failed. Returned status of ${response.status}`);
            reject(err);
          }
        })
        .catch(reject => reject('Error while fetching'));
    })
  }


  static storeTempRestaurantReview(review) {
    //Add Review to IDB
    return new Promise(function (resolve, reject) {
      DBHelper.openDatabase().then(function (db) {
        if (!db) {
          reject('Unable to opeb idb')
        } else {
          let tx = db.transaction('tempreviews', 'readwrite');
          let store = tx.objectStore('tempreviews');
          store.put(review);
          resolve('Stored Successfully');
        }
      })
    })
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
