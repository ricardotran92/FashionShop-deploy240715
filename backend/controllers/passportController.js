import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import User from "../models/user.js";
import { getResetPasswordTemplate } from "../utils/emailTemplates.js";
import ErrorHandler from "../utils/errorHandler.js";
import sendToken from "../utils/sendToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
import { delete_file, upload_file } from "../utils/cloudinary.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import dotenv from "dotenv";
import fs from "fs";

// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
// const User = require('./models/userModel'); // Đường dẫn tới file model người dùng của bạn
// Đường dẫn tới file cấu hình local
const localConfigPath = "backend/config/config.env.local";
const globalConfigPath = "backend/config/config.env.global";

// // Chỉ sử dụng config.env ở Development
// if (process.env.NODE_ENV !== "PRODUCTION") {
  // Kiểm tra sự tồn tại của file cấu hình local -> ưu tiên sử dụng
  if (fs.existsSync(localConfigPath)) {
    dotenv.config({ path: localConfigPath }); // cho phép ghi đè các biến môi trường đã tồn tại override: true
  } else {
    dotenv.config({ path: globalConfigPath });
  }
// }

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${process.env.PORT}/api/auth/google/callback`, // backend port: 3001
      // callbackURL: "auth/google/callback",
    },
    // function(accessToken, refreshToken, profile, done) {
    //   done(null, profile);
    // }
    async (accessToken, refreshToken, profile, done) => {
      // Tìm hoặc tạo người dùng mới dựa trên thông tin từ Google
      // const newUser = {
      //   googleId: profile.id,
      //   email: profile.emails[0].value,
      //   name: profile.displayName,
      //   // Giả sử avatar được lấy từ hình ảnh hồ sơ Google
      //   avatar: {
      //     public_id: "google_avatar_" + profile.id, // Tạo ID tùy ý cho public_id
      //     url: profile.photos[0].value,
      //   },
      //   // Add placeholders for the required fields
      //   address: "Your placeholder address / Vui lòng cập nhật địa chỉ của bạn",
      //   phone: "+84",
      //   password: "Your placeholder password / Vui lòng tạo mật khẩu đăng nhập",
      //   method: "google",
      // };
      // try {
      //   let user = await User.findOne({ googleId: profile.id });
      //   if (!user) {
      //     user = await User.create(newUser);
      //   }
      //   done(null, user);
      // } catch (err) {
      //   done(err, null);
      // }

      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Cập nhật thông tin người dùng nếu đã tồn tại
          user.googleId = profile.id;
          user.avatar = {
            public_id: "google_avatar_" + profile.id,
            url: profile.photos[0].value
          };
          await user.save();
        } else {
          // Tạo người dùng mới nếu không tồn tại
          newUser = {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: {
              public_id: "google_avatar_" + profile.id,
              url: profile.photos[0].value
            },
            address: "Your placeholder address / Vui lòng cập nhật địa chỉ của bạn",
            phone: "+84",
            password: "Your placeholder password / Vui lòng tạo mật khẩu đăng nhập",
            method: "google"
          };
          user = await User.create(newUser);
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Cấu hình FacebookStrategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `http://localhost:${process.env.PORT}/api/auth/facebook/callback`,
      profileFields: ["id", "emails", "name"], // Yêu cầu các trường thông tin từ Facebook
      authType: 'reauthenticate', // Yêu cầu xác thực lại
    },
    async (accessToken, refreshToken, profile, done) => {
      // Tìm hoặc tạo người dùng mới dựa trên thông tin từ Facebook
      // const newUser = {
      //   facebookId: profile.id,
      //   email: profile.emails[0].value,
      //   name: `${profile.name.givenName} ${profile.name.familyName}`,
      //   avatar: {
      //     public_id: "facebook_avatar_" + profile.id,
      //     url: `http://graph.facebook.com/${profile.id}/picture?type=large`,
      //   },
      //   address: "Your placeholder address / Vui lòng cập nhật địa chỉ của bạn",
      //   phone: "+84",
      //   password: "Your placeholder password / Vui lòng tạo mật khẩu đăng nhập",
      //   method: "facebook",
      // };
      // try {
      //   let user = await User.findOne({ facebookId: profile.id });
      //   if (!user) {
      //     user = await User.create(newUser);
      //   }
      //   done(null, user);
      // } catch (err) {
      //   done(err, null);
      // }

      try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Cập nhật thông tin người dùng nếu đã tồn tại
          user.facebookId = profile.id;
          user.avatar = {
            public_id: "facebook_avatar_" + profile.id,
            url: `http://graph.facebook.com/${profile.id}/picture?type=large`
          };
          await user.save();
        } else {
          // Tạo người dùng mới nếu không tồn tại
          newUser = {
            facebookId: profile.id,
            email: profile.emails[0].value,
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            avatar: {
              public_id: "facebook_avatar_" + profile.id,
              url: `http://graph.facebook.com/${profile.id}/picture?type=large`
            },
            address: "Your placeholder address / Vui lòng cập nhật địa chỉ của bạn",
            phone: "+84",
            password: "Your placeholder password / Vui lòng tạo mật khẩu đăng nhập",
            method: "facebook"
          };
          user = await User.create(newUser);
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Serialize use into the session -> cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
  // done(null, user);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // Lấy thông tin người dùng từ DB dựa trên id
  } catch (err) {
    done(err, null);
  }
});

export default passport;
