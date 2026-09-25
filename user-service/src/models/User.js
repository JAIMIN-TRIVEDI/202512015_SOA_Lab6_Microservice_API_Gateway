const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'staff'],
      default: 'student'
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

module.exports = mongoose.model('User', userSchema);
