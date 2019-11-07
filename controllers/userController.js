const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

//cb -callback similar to next but we don't call it next because it isn't originaly from experss
//cb first argument is the error 
//the second argument is the destication - the file will be stored at public/img/users
//the file name will be user-user id-current date-file extenssion
//const ext = file.mimetype.split('/')[1]; - extract the extenssion
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users')
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90
    }).toFile(`public/img/users/${req.file.filename}`);

  next();
});

//a function that verifies that a certain object contain specific fields only
const filterObj = (obj, ...allowedFields) => {
  let newObj = {};
  //Object.keys(obj).forEach - looping over object keys
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) newObj[key] = obj[key];
  })
  return newObj;
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.updateMe = catchAsync(async (req, res, next) => {

  //1.create an error if the user try to change his password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. please use /updateMyPassword', 400))
  }
  //2.update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  })
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false
  });
  res.status(204).json({
    status: 'success',
    data: null
  })
});

// exports.createUsers = catchAsync(async (req, res, next) => {
//   users = await User.insertMany(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: users[1]
//   })
// });

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined, please use signup instead'
  });
}


exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

//do not update passwords with this function
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);