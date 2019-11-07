const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.alerts = (req, res, next) => {
  const {
    alert
  } = req.query;
  if (alert === 'booking') {
    res.locals.alert = 'Your booking was successful, please check your email for a confirmation';
  }
  next();
}

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  })
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({
    slug: req.params.slug
  }).populate({
    path: 'reviews',
    fields: 'review rating user'
  })
  if (!tour) {
    return next(new AppError('there is no tour with that name', 404));
  }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  })
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
}

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign up for new account'
  });
}

exports.getMyTours = catchAsync(async (req, res) => {
  //1. find all bookings (by the logged in user)
  const bookings = await Booking.find({
    user: req.user.id
  });

  //2. find tours with the returned IDs
  const tourIDs = bookings.map(element => element.tour);
  //instead of doing something like this:
  // const tours = [];
  // for(var tourID of tourIDs){
  //   tours.push(await Tour.find({_id: tourID}));
  // }
  //it is also possible to write a single line that includes $in operator
  //$in operator will get all the documents that their _id included in the tourIDs array
  const tours = await Tour.find({
    _id: {
      $in: tourIDs
    }
  });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  })

});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
}

//by specifying the fields we prevent additional properties added by hackers
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidators: true
  });
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
  })
});