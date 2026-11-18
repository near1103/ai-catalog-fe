'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LoaderCircle, ShoppingBag } from 'lucide-react';
import { z } from 'zod';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useAuth } from '@/features/auth/auth-provider';
import { ErrorMessage } from '@/components/ui/shared';

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
const signInErrors = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Unable to connect. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed. Please try again.',
  'auth/popup-blocked': 'Allow pop-ups in your browser to sign in with Google.',
};
const signInError = error => signInErrors[error.code] || 'Unable to sign in. Please try again.';
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.8-3.5 6.1-8.7 6.1-15z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20.4 20.4 0 0 0 24 44z"
      />
      <path fill="#FBBC05" d="M12.6 27.5a12.1 12.1 0 0 1 0-7.8v-5.3H5.8a20 20 0 0 0 0 18.4z" />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3l5.9-5.9A19.7 19.7 0 0 0 24 4 20.4 20.4 0 0 0 5.8 14.4l6.8 5.3C14.2 15 18.7 11.9 24 11.9z"
      />
    </svg>
  );
}

export default function Page() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  const busy = isSubmitting || googleBusy;
  const submit = handleSubmit(async values => {
    setError('');
    try {
      await auth.login(values.email, values.password);
      router.replace('/admin/products');
    } catch (error) {
      setError(signInError(error));
    }
  });
  const googleSignIn = async () => {
    setGoogleBusy(true);
    setError('');
    try {
      await auth.google();
      router.replace('/admin/products');
    } catch (error) {
      setError(signInError(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-shell">
        <Link className="brand sign-in-brand" href="/" aria-label="Shop — home">
          <ShoppingBag size={28} /> shop
        </Link>
        <Breadcrumbs items={[{ label: 'Sign in' }]} />
        <section className="sign-in-card" aria-labelledby="sign-in-title">
          <div className="sign-in-heading">
            <h1 id="sign-in-title">Sign in</h1>
            <p>Enter your email and password to access your admin account.</p>
          </div>
          <ErrorMessage error={error || auth.error} />
          <form noValidate onSubmit={submit} aria-busy={isSubmitting}>
            <div className={'sign-in-field' + (errors.email ? ' has-error' : '')}>
              <label htmlFor="sign-in-email">Email address</label>
              <div className="sign-in-input">
                <input
                  id="sign-in-email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@example.com"
                  disabled={busy}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'sign-in-email-error' : undefined}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="sign-in-field-error" id="sign-in-email-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className={'sign-in-field' + (errors.password ? ' has-error' : '')}>
              <label htmlFor="sign-in-password">Password</label>
              <div className="sign-in-input">
                <input
                  id="sign-in-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={busy}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'sign-in-password-error' : undefined}
                  {...register('password')}
                />
                <button
                  className="sign-in-password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={busy}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="sign-in-field-error" id="sign-in-password-error" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            <button className="sign-in-submit" type="submit" disabled={busy || !!auth.error}>
              {isSubmitting ? (
                <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="sign-in-divider">
            <span>or</span>
          </div>
          <button
            className="sign-in-google"
            type="button"
            disabled={busy || !!auth.error}
            onClick={googleSignIn}
          >
            {googleBusy ? (
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            {googleBusy ? 'Signing in…' : 'Continue with Google'}
          </button>
        </section>
      </div>
    </main>
  );
}
