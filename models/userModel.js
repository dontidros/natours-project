const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
//
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'

  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    //we don't want the password to be seen at the client
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (element) {
        return element === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function () {
  //this.isNew stands for a new document that just been created
  if (!this.isModified('password') || this.isNew) return next();
  //we set timestamp to a second before now to insure that it won't be after token's timestamp 
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//a query middlewaretakes which takes care that every find method will bring us only the active users
//this (key word) refers to the current query
userSchema.pre('/^find/', function (next) {
  this.find({
    active: {
      $ne: false
    }
  });
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    //turn passwordChangeAt to unix time in order to compare with JWTTimestamp 
    //(,10 - 10 is the the decimal base. this is probably necessary to specify the base 
    //when we parse date into int(I don't really know...))
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  //false means not changed
  return false;
}

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
//