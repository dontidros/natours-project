const express = require('express');
const {
  aliasTopTours,
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages
} = require('./../controllers/tourController');

const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();


router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year')
  .get(authController.protect,
    authController.restrictTo('admin', 'guide', 'lead-guide'),
    getMonthlyPlan);

//a route for getting the tours that are located within a certain radius from where the user is
//distance - the radius in ml or km
//center - where the user is
//latlng - longitude and latitude (the coordinates)
//unit - an option to specify the radius in km or miles
//we could do this routing also using this query string: tours-within?distance=232&center=40,45&unit=ml
router.route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);



router.route('/')
  .get(getAllTours)
  .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), createTour);

router.route('/:id')
  .get(getTour)
  .patch(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour)

  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), deleteTour);

// router.route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );


module.exports = router;
//