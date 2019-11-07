const mongoose = require('mongoose');
const Tour = require('./tourModel');

// review , rating createdAt, ref to the tour, ref to the user
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Every review requires a text']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1.0'],
    max: [5, 'Rating must be below 5']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  }
  //toJSON, toObject - if we add more fields to the schema object during the response process,
  //it will apear at the output 
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

reviewSchema.index({
  tour: 1,
  user: 1
}, {
  unique: true
});



//query middleware
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
})



//when we use ...Schema.statics, this(key word) refer to the model and not to an object
//(statics  static)aggregate is a method that can only be called in a static way
//stats - statistics
//$match only the reviews that thier tour field equal to tourId parameter
//$group { _id: '$tour'.. - group all the values from all reviews tour fields  
// (_id - the field that we want to group, not the actual _id field)
//nRating - number of ratings (add 1 on every review saved by the $sum operator)
//$avg - after the $sum operation, '$raiting' contains the summary of ratings  
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([{
      $match: {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nRating: {
          $sum: 1
        },
        avgRating: {
          $avg: '$rating'
        }
      }
    }
  ])

  //if there are any reviews about the tour stats won't be empty
  if (stats.length > 0) {
    //await Tour - we do not need to store the result on a variable
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    })
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5 // 4.5 is the default
    })
  }
}


//a post middleware doesn't get access to next - SO DO NOT USE NEXT() ON A POST MIDDLEWARE
//this - the current review
//constructor - enable to use the calcAverageRatings method (which is a static method)
//even before we created a model out of schema
//by calling calcAverageRatings on every review saved we make sure that the ratings average will
//stay updated and accurate
reviewSchema.post('save', function (next) {
  this.constructor.calcAverageRatings(this.tour);
})


//^findOneAnd - will fit to findOneAndDelete and also to findOneAndUpdate
//for this kind of methods(update and delete) we can only use query middleware 
//because its a query middleware, this refer to the query and not to a document
//in order to gain access to the document, we execute the query (by findOne)
//we are doing all of this in order to get the tour id (tour field in the review)
//but the other details are still the old details from the database 
//(this pre hook takes place before executing the query and updating the database)
//r = review - we are going to BIND this property to the next middleware
//that will be executed after the query has finished and then we can access
//the updated details
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

//this.r.tour - r is the parameter that been added at the middleware above
//constructor - because calcAverageRatings is a static method we need a constructor 
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

Review.on('index', function (err) {
  if (err) {
    console.error('Review index error ori ', err);
  } else {
    console.info('Review indexing complete');
  }
});

module.exports = Review;

//POST /tours/dsfffsd/reviews