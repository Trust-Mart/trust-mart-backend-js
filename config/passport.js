import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserService from '../services/UserService.js';
import dotenv from 'dotenv';
import { AuthMethod } from '../utils/types.js';

dotenv.config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google Profile:', profile);
      
      const email = profile.emails[0].value;
      const googleId = profile.id;
      
      let user = await UserService.findUserByGoogleId(googleId);
      
      if (user) {
        if (user.isverified) {
          return done(null, user);
        } else {
          return done(null, { ...user.toJSON(), needsVerification: true });
        }
      }
      
      user = await UserService.findUserByEmail(email);
      
      if (user) {
        if (user.auth_method === AuthMethod.regular && !user.social_id) {
          user = await UserService.linkGoogleAccount(user.id, googleId);
          return done(null, { ...user.toJSON(), wasLinked: true });
        } else if (user.auth_method === AuthMethod.social) {
          return done(null, user);
        }
      }
      
      const newUser = await UserService.createSocialUser({
        social_id: googleId,
        email: email,
        username: email.split('@')[0],
        password: null,
        isverified: false,
        verificationToken: UserService.generateOTP(),
        // profilePicture: profile.photos[0]?.value,
        auth_method: AuthMethod.both,
        country: req?.query?.country ?? null
      });
      
      return done(null, { ...newUser.toJSON(), isNewUser: true });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserService.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;