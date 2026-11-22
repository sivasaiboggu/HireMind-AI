import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase, hasSupabaseConfig } from '../services/supabase';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod/mini';
import { Brand } from '../components/layout/Brand';
import { ThemeControl } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigation } from '../components/layout/navigation';

const credentials = z.object({ email: z.email('Enter a valid email address.'), password: z.string().check(z.minLength(1, 'Enter your password.')) });
const emailAddress = credentials.shape.email;

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const returnTo = navigation.find(({ path }) => path === state?.from?.pathname)?.path ?? '/hiring';
  const { addToast, setGuestMode } = useAppStore();
  
  // Auth Modes
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpType, setOtpType] = useState<'signup' | 'email'>('email');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const validated = credentials.safeParse({ email, password });
    if (!validated.success) {
      setErrorMsg(validated.error.issues[0].message);
      return;
    }
    setLoading(true);

    if (!supabase) {
      addToast('error', 'Account sign-in is unavailable. Continue as a guest.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Candidate',
              target_role: targetRole.trim() || 'Software Engineer'
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;
        
        if (data.session) {
          addToast('success', 'Account created.');
          navigate(returnTo, { replace: true });
        } else {
          addToast('success', 'Check your email for a six-digit confirmation code.');
          setOtpType('signup');
          setOtpSent(true);
          setCountdown(60);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        addToast('success', 'Signed in.');
        navigate(returnTo, { replace: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
      addToast('error', err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Sign-In Initiation
  const handleSendOtp = async () => {
    if (!emailAddress.safeParse(email).success) {
      setErrorMsg('Enter a valid email address to request a code.');
      return;
    }
    
    setErrorMsg(null);
    setLoading(true);

    if (!supabase) {
      addToast('error', 'Supabase configuration is missing.');
      setLoading(false);
      return;
    }

    try {
      const { error } = otpSent && otpType === 'signup'
        ? await supabase.auth.resend({ type: 'signup', email })
        : await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true // creates user automatically if they don't exist
        }
      });

      if (error) throw error;

      setOtpSent(true);
      setCountdown(60);
      addToast('success', 'We sent a six-digit code to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP.');
      addToast('error', err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Submission
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!supabase) {
      setErrorMsg('Account sign-in is unavailable here.');
      setLoading(false);
      return;
    }
    const token = otpCode.join('');
    if (!/^\d{6}$/.test(token)) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      // Verify OTP token with the specified type (either 'signup' for new user email confirmation or 'email' for magic link/OTP logins)
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: otpType
      });

      if (error) {
        // Fallback: try the other type just in case
        const alternativeType = otpType === 'signup' ? 'email' : 'signup';
        const { error: altError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: alternativeType
        });
        if (altError) throw error; // Throw original error if both fail
      }

      addToast('success', 'Email confirmed.');
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
      addToast('error', err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (!/^\d?$/.test(val)) return; // only allow numbers

    const nextCode = [...otpCode];
    nextCode[index] = val.substring(val.length - 1); // Keep only the last character
    setOtpCode(nextCode);

    // Auto-focus next input
    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0 && inputRefs.current[index - 1]) {
        // Focus previous input on backspace if current field is empty
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const chars = pastedData.split('');
      setOtpCode(chars);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setErrorMsg(null);
    if (!supabase) {
      addToast('error', 'Supabase config is offline. Social login requires database setup.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Social login failed.');
      addToast('error', err.message || 'Social login failed.');
    }
  };

  const handleGuestMode = () => {
    setGuestMode(true);
    addToast('info', 'Your work will be saved in this browser.');
    navigate(returnTo, { replace: true });
  };


  const title = otpSent ? 'Check your email.' : isSignUp ? 'Create an account.' : hasSupabaseConfig ? 'Sign in.' : 'Continue as a guest.';
  const description = otpSent
    ? `Enter the six-digit code sent to ${email}.`
    : isSignUp
      ? 'Save your work and pick it up on another device.'
      : hasSupabaseConfig
        ? 'Open your saved resume reviews, mock interviews, and study plans.'
        : 'Account sign-in is unavailable here. You can still save your work in this browser.';

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Brand />
        <ThemeControl />
      </header>
      <main className="auth-layout page-enter">
        <section className="auth-intro">
          <div>
            <h1>Hire and prepare</h1>
            <p>Track candidates and schedule interviews. When you’re applying for a role yourself, review your resume and practise your answers.</p>
          </div>
          <ul>
            <li><strong>Hiring pipeline</strong><span>Review applications and record interview outcomes.</span></li>
            <li><strong>Resume review</strong><span>Find missing keywords and bullets to rewrite.</span></li>
            <li><strong>Mock interviews</strong><span>Answer by voice or text and review your feedback.</span></li>
            <li><strong>Coding practice</strong><span>Run JavaScript or Python against test cases.</span></li>
          </ul>
        </section>
        <section className="auth-form" aria-labelledby="auth-title">
          <header><h2 id="auth-title">{title}</h2><p>{description}</p></header>
          {errorMsg && <p role="alert" className="error-text">{errorMsg}</p>}
          {hasSupabaseConfig && !otpSent && (
            <div className="auth-options">
              <Button variant="ghost" onClick={() => handleSocialLogin('google')}>Google</Button>
              <Button variant="ghost" onClick={() => handleSocialLogin('github')}>GitHub</Button>
            </div>
          )}
          {hasSupabaseConfig && (otpSent ? (
            <form className="form-stack" onSubmit={handleVerifyOtp}>
              <fieldset className="otp-field">
                <legend>Verification code</legend>
                <div className="otp-inputs">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      aria-label={`Digit ${index + 1}`}
                      maxLength={1}
                      value={digit}
                      ref={(element) => { inputRefs.current[index] = element; }}
                      onChange={(event) => handleOtpChange(event.currentTarget, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      onPaste={handleOtpPaste}
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </fieldset>
              <Button type="submit" loading={loading}>Verify code <ArrowRight size={16} aria-hidden="true" /></Button>
              <div className="auth-options">
                <button type="button" className="text-control" onClick={() => { setOtpSent(false); setOtpType('email'); setOtpCode(Array(6).fill('')); setErrorMsg(null); }}>Change email</button>
                <button type="button" className="text-control" onClick={handleSendOtp} disabled={countdown > 0 || loading}>{countdown ? `Resend in ${countdown}s` : 'Resend code'}</button>
              </div>
            </form>
          ) : (
            <>
              <form className="form-stack" onSubmit={authMethod === 'password' ? handleSubmit : (event) => { event.preventDefault(); void handleSendOtp(); }}>
                {isSignUp && (
                  <>
                    <label>Full name<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
                    <label>Target role<input required value={targetRole} onChange={(event) => setTargetRole(event.target.value)} /></label>
                  </>
                )}
                <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                {authMethod === 'password' && (
                  <div className="password-field">
                    <label htmlFor="auth-password">Password</label>
                    <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} />
                    <button type="button" className="icon-control" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                )}
                <Button type="submit" loading={loading}>
                  {isSignUp ? 'Create account' : authMethod === 'password' ? 'Sign in' : 'Send email code'} <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </form>
              <div className="auth-options">
                {!isSignUp && (
                  <button type="button" className="text-control" onClick={() => { setAuthMethod(authMethod === 'password' ? 'otp' : 'password'); setErrorMsg(null); }}>
                    {authMethod === 'password' ? 'Use an email code' : 'Use a password'}
                  </button>
                )}
                <button type="button" className="text-control" onClick={() => { setIsSignUp(!isSignUp); setAuthMethod('password'); setErrorMsg(null); }}>
                  {isSignUp ? 'Back to sign in' : 'Create an account'}
                </button>
              </div>
            </>
          ))}
          {!otpSent && (
            <div className={hasSupabaseConfig ? 'guest-option' : ''}>
              <Button variant={hasSupabaseConfig ? 'subtle' : 'primary'} onClick={handleGuestMode}>
                Continue as guest <ArrowRight size={16} aria-hidden="true" />
              </Button>
              {hasSupabaseConfig && <p>Your guest work stays in this browser.</p>}
            </div>
          )}
        </section>
      </main>
      <footer className="auth-footer"><a href="#/privacy">Privacy and data</a></footer>
    </div>
  );
};

export default Auth;
