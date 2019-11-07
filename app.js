const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoute');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');


const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//GLOBAL MIDDLEWARES//////

//implementing CORS
app.use(cors());

//serving static files 
//define that all the static files will be served from a folder called public (that contains css and img)
app.use(express.static(path.join(__dirname, 'public')));
//set security http headers 
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour'
});
app.use('/api', limiter);

//Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post('/webhook-checkout',
  express.raw({
    type: 'application/json'
  }), bookingController.webhookCheckout);

//body parser, reading data from body into req.body
//limit 10kb no more then 10 kilobites at the body
app.use(express.json({
  limit: '10kb'
}));

//allow urlencoded data (from html forms submission)
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}))

//cookie parser, reading data from cookies
//the data will be at req.cookies
app.use(cookieParser());

//data sanitization against no sql query injections 
//we place this middleware right here after the body parser
//because this is the exact spot where the data comes in from the req.body
app.use(mongoSanitize());

//data sanitization against XXS attacks//
app.use(xss());

//prevent parameter pollution
//the whitelist is for parameters that we like to allow duplication
app.use(hpp({
  whitelist: ['duration', 'ratingQuantity', 'ratingAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// app.use(compression);

//test middleware (unnecessary at the moment)
// app.use((req, res, next) => {
//   next();
// })

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
})

//ROUTES//

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);

//404 route
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;