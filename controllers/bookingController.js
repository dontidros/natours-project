const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
///const AppError = require('./../utils/appError');//


exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1. get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2. create checkout session secret key - 	
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [{
      name: `${tour.name} Tour`,
      description: tour.summary,
      images: [`${req.protocol}://${req.get('host')}/${tour.imageCover}`],
      amount: tour.price * 100,
      currency: 'usd',
      quantity: 1
    }]
  })
  //3. create session as response
  res.status(200).json({
    status: 'success',
    session
  });

});


// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //reminder: this is only temporary because it's unsecure
//   const {
//     tour,
//     user,
//     price
//   } = req.query;
//   if (!tour && !user && !price) return next();
//   await Booking.create({
//     tour,
//     user,
//     price
//   });

//   //creating a new request only with the original url of the home page (without the query string
//   //because we do not want the query string to apear at the browser bar 
//   //tour, user, and price will not be defined so the request will move on to the next middleware 
//   //(which is authController.isLoggedIn)
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({
    email: session.customer_email
  })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({
    tour,
    user,
    price
  });
}

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {

    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') createBookingCheckout(event.data.object);
  res.status(200).json({
    recieved: true
  });

}

//factory methods
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);