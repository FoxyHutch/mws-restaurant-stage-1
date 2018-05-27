let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;


  const picture = document.createElement('picture');

  //large webP
  const sourceLargeWebP = document.createElement('source');
  sourceLargeWebP.media = '(min-width: 1000px)';
  sourceLargeWebP.type = 'image/webp';
  sourceLargeWebP.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'largeWEBP');

  //large image
  const sourceLarge = document.createElement('source');
  sourceLarge.media = '(min-width: 1000px)';
  sourceLarge.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'large');

  //medium webP
  const sourceMediumWebP = document.createElement('source');
  sourceMediumWebP.media = '(min-width: 481px)';
  sourceMediumWebP.type = 'image/webp';
  sourceMediumWebP.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'mediumWEBP');

  //medium image
  const sourceMedium = document.createElement('source');
  sourceMedium.media = '(min-width: 481px)';
  sourceMedium.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'medium');

  //small webP
  const sourceSmallWebP = document.createElement('source');
  sourceSmallWebP.media = '(max-width: 480px)';
  sourceSmallWebP.type = 'image/webp';
  sourceSmallWebP.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'smallWEBP');

  //small image
  const sourceSmall = document.createElement('source');
  sourceSmall.media = '(max-width: 480px)';
  sourceSmall.srcset = DBHelper.imageUrlForRestaurant(restaurant, 'small');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.id = 'restaurant-image'
  image.alt = 'Photograph of '+ restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 'small');


  picture.append(sourceLargeWebP)
  picture.append(sourceLarge);
  picture.append(sourceMediumWebP)
  picture.append(sourceMedium);
  picture.append(sourceSmallWebP)
  picture.append(sourceSmall)
  picture.append(image);

const imgContainer = document.getElementById('restaurant-img-container');

imgContainer.append(picture);


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {

  const li = document.createElement('li');
  const div = document.createElement('div'); 
  const name = document.createElement('p');
  const date = document.createElement('p');
  
  

  div.className = 'review-head';

  date.innerHTML = review.date;
  date.className = 'review-date'
  
  name.className = 'review-name';
  name.innerHTML = review.name;
  

  
  li.appendChild(div);
  div.appendChild(name);
  div.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating'
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comment'
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.setAttribute('aria-current', 'page');
  a.innerHTML = restaurant.name;
  a.href = '#';

  li.appendChild(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
