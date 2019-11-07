const mongoose = require('mongoose');
const slugify = require('slugify');



//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A tour name must have less or equal then 40 characters'],
    minlength: [10, 'A tour name must have more or equal then 10 characters'],

  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either easy, medium or difficult'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be at least 1.0'],
    max: [5, 'Rating must be below 5'],
    set: val => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'a tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below the regular price'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a cover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //GeoJSON (latitude and longitude (in that order))
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [{
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number
  }],
  guides: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]

}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
})

//INDEXES
//1 means asc (0 means desc)
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});
tourSchema.index({
  slug: 1
});
//2dsphere - a special key for real longitute and latitude coordinations
tourSchema.index({
  startLocation: '2dsphere'
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//virtual populate -  does not work for me!
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE
//this middleware will be executed before .save() and .create()
//this (key word) refers to the tour object that sent
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

//this following document middleware function will bring  guides data from users collection
// but because embedding all guides data into tours is very problematic
// (if the guide will update his details, this data should be updated at the tours collection as well)
// we will use child reference instead of this function 
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async id => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// })

//QUERY MIDDLEWARE
//this middleware doesn't allows secret tours to apear at the results of find methods
//operates on every method that starts with find 
//$ne - not equal
//this (the key word) will bring the query object (not any tour object) because its a query middleware
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  })
  this.start = Date.now();
  next();
})

//runs after the query has finished
//it calculates how much time in milliseconds it took to executes the query
//in it we can use the start property that we created on the pre middleware
// tourSchema.post(/^find/, function (docs, next) {

//   next();
// })

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordConfirm'
  });
  next();
});


//AGGREGATION MIDDLEWARE EXAMPLE
//this middleware doesn't allows secret tours to apear at the results of aggregate method
//this (key word) refers to  the aggregation object
//unshift method - add to the beggining of an array
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: {
//         $ne: true
//       }
//     }
//   });
//   console.log(this.pipeline);
//   next();
// })

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;