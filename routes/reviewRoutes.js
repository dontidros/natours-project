const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

//mergeParams - each router as access only to its params
//mergeParams fetch also the parameters from the parent route
const router = express.Router({
  mergeParams: true
});

//only logged in users will be able to make crud operations on the reviews
router.use(authController.protect);

//createReviews is only for development 
//router.route('/many').post(reviewController.createReviews);

router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router.route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;