const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
//const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

//verify that the file is an image only
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image, please upload only images', 400), false);
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([{
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  //cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({
      quality: 90
    }).toFile(`public/img/tours/${req.body.imageCover}`);
  //images
  req.body.images = [];
  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({
        quality: 90
      }).toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }))
  next();
});

//TOP 5 CHEAP TOURS MIDDLEWARE
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = ' -ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summery,difficulty';
  next();
}

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, {
  path: 'reviews'
});

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

//the new deleteTour - using factory deleteOne function
exports.deleteTour = factory.deleteOne(Tour);

//the old deleteTour
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([{
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    },
    {
      $group: {
        _id: {
          $toUpper: '$difficulty'
        },
        numRatings: {
          $sum: '$ratingsQuantity'
        },
        numTours: {
          $sum: 1
        },
        avgRating: {
          $avg: '$ratingsAverage'
        },
        angPrice: {
          $avg: '$price'
        },
        minPrice: {
          $min: '$price'
        },
        maxPrice: {
          $max: '$price'
        }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }

  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

  const year = req.params.year * 1;
  const plan = await Tour.aggregate([{
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $gte: new Date(`${year}-01-01`)
        }
      }
    },
    {
      $group: {
        _id: {
          $month: '$startDates'
        },
        numTourStarts: {
          $sum: 1
        },
        tours: {
          $push: '$name'
        }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numTourStarts: -1
      }
    },
    {
      $limit: 12
    }


  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  })

});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const {
    distance,
    latlng,
    unit
  } = req.params;
  const [lat, lng] = latlng.split(',');

  //this is how we calculate the radius (distance divided by the 'radius of the earth')
  //  - according to the unit (ml or km);
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng'));
  }
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [
          [lng, lat], radius
        ]
      }
    }
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours

    }
  })
});

//keep in mind - $geoNear will work only if start location property has a 2dsphere index
//near - user location
//lng *1 lat *1 - string to number convertion
//distanceField: 'distance' - distance will be the variable which contains all the distances
//distanceMultiplier: 0.001 - turns the distance in meters to distance in km (devide by 1000)
//reminder - project property is the fields that we want inside the obj (1 means yes)
exports.getDistances = catchAsync(async (req, res, next) => {
  const {
    latlng,
    unit
  } = req.params;

  const multiplier = unit === 'ml' ? 0.000621371 : 0.001;

  const [lat, lng] = latlng.split(',');
  if (!lat || !lng) {
    next(new AppError('Please provide latitude and longitude in the format lat,lng'), 400);
  }

  const distances = await Tour.aggregate([{
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]

        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })
});