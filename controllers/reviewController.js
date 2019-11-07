const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');


exports.setTourUserIds = (req, res, next) => {
  //allow nested routes (the user can deside wheter set the parameters manually or not)
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
}



exports.createReviews = catchAsync(async (req, res, next) => {
  reviews = await Review.insertMany(req.body);
  res.status(201).json({
    status: 'success',
    data: reviews[1]
  })
});

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);