import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { GoogleAuthUseCase } from '../application/use-cases/GoogleAuthUseCase';
import { UserRepository } from '../../infra/mongoose/repositories/UserRepository';

const repo        = new UserRepository();
const googleAuth  = new GoogleAuthUseCase(repo);

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name  = profile.displayName;

        if (!email) {
          return done(new Error('EMAIL_NOT_PROVIDED'), undefined);
        }

        const result = await googleAuth.execute({
          googleId: profile.id,
          email,
          name,
        });

        if (result.isFailure) {
          return done(new Error(result.error), undefined);
        }

        return done(null, result.getValue());
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;