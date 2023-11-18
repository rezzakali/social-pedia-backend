import { Schema, model } from 'mongoose';

const socialLinkSchema = new Schema({
  platform: {
    type: String,
  },
  link: {
    type: String,
  },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minLength: 3,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value) => {
          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
          return emailRegex.test(value);
        },
        message: 'Enter a valid email address!',
      },
    },
    password: {
      type: String,
      required: [true, 'Enter your password!'],
      minLength: [6, 'Password must be 6 characters!'],
    },
    profileImage: {
      url: {
        type: String,
      },
      fileId: {
        type: String,
      },
    },
    location: {
      type: String,
      required: true,
    },
    occupation: {
      type: String,
      default: 'Student',
    },
    friends: Array(),
    socialLinks: [socialLinkSchema],
  },
  { timestamps: true }
);

const User = model('User', userSchema);

export default User;
