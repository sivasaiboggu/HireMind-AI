import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase, hasSupabaseConfig } from '../services/supabase';
import { 
  Shield, Mail, Lock, User, Briefcase, AlertCircle, Sparkles, 
  ArrowRight, Brain, Code2, FileText, CheckCircle2, LockKeyhole, Eye, EyeOff, KeyRound, ChevronLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, setGuestMode } = useAppStore();
  
  // Auth Modes
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  
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
    setLoading(true);

    if (!hasSupabaseConfig) {
      addToast('error', 'Supabase is not configured. Use Offline Guest Mode to explore the platform!');
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
          addToast('success', 'Account registered and logged in successfully!');
          navigate('/dashboard');
        } else {
          addToast('success', 'Registration successful! Verification link/code sent to your email.');
          // Automatically switch to OTP verify if they want to enter a code, or keep standard signup messages
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        addToast('success', 'Logged in successfully.');
        navigate('/dashboard');
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
    if (!email) {
      addToast('error', 'Please enter your email address first.');
      setErrorMsg('Please enter your email address to request an OTP code.');
      return;
    }
    
    setErrorMsg(null);
    setLoading(true);

    if (!hasSupabaseConfig) {
      addToast('error', 'Supabase configuration is missing.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true // creates user automatically if they don't exist
        }
      });

      if (error) throw error;

      setOtpSent(true);
      setCountdown(60);
      addToast('success', 'A 6-digit OTP verification code has been sent to your email.');
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

    const token = otpCode.join('');
    if (token.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      // Verify OTP token with type 'email' (for standard magic link/OTP logins)
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        // Fallback: try verification as type 'signup' in case it's a new email confirmation code
        const { error: signupError } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'signup'
        });
        if (signupError) throw error; // Throw original error if both fail
      }

      addToast('success', 'Verification successful! Logging you in...');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
      addToast('error', err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (isNaN(Number(val))) return; // only allow numbers

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

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
    setErrorMsg(null);
    if (!hasSupabaseConfig) {
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
    addToast('info', 'Entered platform in Offline Guest Mode. Data will be saved locally.');
    navigate('/dashboard');
  };

  const styles = `
    html, body {
      background-color: #f8fafc !important;
      margin: 0 !important;
      padding: 0 !important;
      overscroll-behavior: none !important;
      overflow-x: hidden !important;
      min-height: 100vh !important;
    }

    @keyframes pulseSoft {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.02); opacity: 1; }
    }
    @keyframes lineFlow {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }

    .auth-split-container {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: 'DM Sans', sans-serif;
      position: relative;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .bg-grid-light {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(15, 23, 42, 0.015) 1px, transparent 1px),
        linear-gradient(rgba(13, 148, 136, 0.008) 1px, transparent 1px),
        linear-gradient(90deg, rgba(13, 148, 136, 0.008) 1px, transparent 1px);
      background-size: 32px 32px, 64px 64px, 64px 64px;
      z-index: 0;
    }

    .mesh-glow-1 {
      position: absolute;
      width: 650px;
      height: 650px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(13, 148, 136, 0.04) 0%, transparent 70%);
      filter: blur(80px);
      top: -150px;
      left: -200px;
      z-index: 0;
      animation: pulseSoft 8s infinite ease-in-out alternate;
    }
    .mesh-glow-2 {
      position: absolute;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.03) 0%, transparent 70%);
      filter: blur(90px);
      bottom: -200px;
      right: -150px;
      z-index: 0;
      animation: pulseSoft 10s infinite ease-in-out alternate-reverse;
    }

    .auth-showcase-panel {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      border-right: 1px solid #e2e8f0;
      position: relative;
      background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
      z-index: 1;
    }

    .auth-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      position: relative;
      z-index: 1;
      background-color: transparent;
    }

    .showcase-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(13, 148, 136, 0.06);
      border: 1px solid rgba(13, 148, 136, 0.15);
      color: #0f766e;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 6px 12px;
      border-radius: 100px;
      margin-bottom: 24px;
    }

    .showcase-title {
      font-family: 'Clash Display', 'Syne', sans-serif;
      font-size: 42px;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin-bottom: 18px;
    }

    .showcase-title span {
      background: linear-gradient(90deg, #0d9488 0%, #4f46e5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .showcase-desc {
      font-size: 15px;
      color: #475569;
      line-height: 1.6;
      max-width: 520px;
      margin-bottom: 40px;
    }

    .features-stack {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    }

    .feature-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      gap: 18px;
      align-items: flex-start;
      transition: all 300ms ease;
    }

    .feature-card:hover {
      border-color: rgba(13, 148, 136, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.04);
    }

    .feature-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .feature-icon-wrapper.cyan {
      background: rgba(13, 148, 136, 0.06);
      border: 1px solid rgba(13, 148, 136, 0.12);
      color: #0d9488;
    }

    .feature-icon-wrapper.purple {
      background: rgba(79, 70, 229, 0.06);
      border: 1px solid rgba(79, 70, 229, 0.12);
      color: #4f46e5;
    }

    .feature-icon-wrapper.amber {
      background: rgba(217, 119, 6, 0.06);
      border: 1px solid rgba(217, 119, 6, 0.12);
      color: #d97706;
    }

    .feature-details h4 {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .feature-details p {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.5;
    }

    .avatar-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 100px;
      border: 1px solid #e2e8f0;
      font-size: 11px;
      font-weight: 500;
      color: #334155;
      margin-top: 8px;
      display: inline-flex;
    }
    .avatar-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0d9488;
      box-shadow: 0 0 8px rgba(13, 148, 136, 0.6);
    }

    .showcase-footer {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .premium-auth-card {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 28px;
      padding: 40px;
      box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 10px 10px -5px rgba(15, 23, 42, 0.02);
      transition: all 300ms ease;
    }

    .premium-auth-card:hover {
      box-shadow: 0 25px 35px -5px rgba(15, 23, 42, 0.08);
      border-color: #cbd5e1;
    }

    .auth-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .auth-input-field {
      width: 100%;
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 14px !important;
      color: #0f172a !important;
      padding: 13px 16px 13px 44px !important;
      font-size: 13.5px !important;
      transition: all 200ms ease !important;
      outline: none !important;
    }

    .auth-input-field:focus {
      border-color: #0d9488 !important;
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1) !important;
      background: #ffffff !important;
    }

    .auth-input-icon {
      position: absolute;
      left: 15px;
      top: 36px;
      width: 17px;
      height: 17px;
      color: #64748b;
      transition: color 200ms ease;
    }

    .auth-input-field:focus + .auth-input-icon,
    .auth-input-group:focus-within .auth-input-icon {
      color: #0d9488;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 200ms ease;
    }

    .social-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      transform: translateY(-2px);
    }

    .social-btn:active {
      transform: translateY(0);
    }

    .btn-primary-teal {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
      transition: all 250ms ease;
    }

    .btn-primary-teal:hover {
      background: linear-gradient(135deg, #0f766e 0%, #115e59 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(13, 148, 136, 0.25);
    }

    .btn-primary-teal:active {
      transform: translateY(0);
    }

    .btn-primary-teal:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .offline-guest-btn {
      width: 100%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      color: #475569;
      padding: 12px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 200ms ease;
    }

    .offline-guest-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      color: #0f172a;
    }

    .security-badge-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px 14px;
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 18px;
    }

    .toggle-pass-btn {
      position: absolute;
      right: 14px;
      top: 36px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      border-radius: 5px;
      transition: color 150ms ease;
    }

    .toggle-pass-btn:hover {
      color: #0f172a;
    }

    /* OTP Inputs styling */
    .otp-inputs-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin: 12px 0;
    }

    .otp-box {
      width: 100%;
      height: 48px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #0f172a;
      font-size: 20px;
      font-weight: 700;
      text-align: center;
      outline: none;
      transition: all 200ms ease;
    }

    .otp-box:focus {
      border-color: #0d9488;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
    }

    .toggle-link-btn {
      background: none;
      border: none;
      color: #0f766e;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: 13px;
      transition: color 150ms ease;
    }

    .toggle-link-btn:hover {
      color: #0d9488;
      text-decoration: underline;
    }

    .help-provider-card {
      background: rgba(217, 119, 6, 0.04);
      border: 1px solid rgba(217, 119, 6, 0.15);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 11px;
      color: #b45309;
      line-height: 1.4;
      margin-top: 10px;
    }

    @media (max-width: 1023px) {
      .auth-showcase-panel {
        display: none !important;
      }
      .auth-form-panel {
        flex: 1;
        padding: 24px;
      }
      .premium-auth-card {
        padding: 32px 24px;
      }
    }
  `;

  return (
    <div className="auth-split-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {/* Background decoration grid */}
      <div className="bg-grid-light" />
      <div className="mesh-glow-1" />
      <div className="mesh-glow-2" />

      {/* LEFT COLUMN: Showcase panel in light theme */}
      <div className="auth-showcase-panel">
        <div>
          {/* Logo brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain style={{ width: '20px', height: '20px', color: '#ffffff' }} />
            </div>
            <span style={{
              fontFamily: 'Clash Display, Syne, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#0f172a'
            }}>
              HireMind AI
            </span>
          </div>

          <div className="showcase-badge">
            <Sparkles style={{ width: '12px', height: '12px' }} />
            AI-Proctored Ecosystem
          </div>

          <h1 className="showcase-title">
            The professional way to simulate <span>tech interviews</span>.
          </h1>
          <p className="showcase-desc">
            An advanced sandbox combining interactive neural recruiters, multi-file code workspace sandbox execution, and live ATS resume structure grading.
          </p>

          <div className="features-stack">
            {/* Sophia / Recruiter Card */}
            <div className="feature-card">
              <div className="feature-icon-wrapper cyan">
                <Brain style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>Interactive Recruiter Characters</h4>
                <p>Simulate recruiter interactions with real-time responsive head nodding, mouth shapes, and status tracking.</p>
                <div className="avatar-pill">
                  <span className="avatar-dot" />
                  Sophia, Marcus & Emily Online
                </div>
              </div>
            </div>

            {/* Sandbox Card */}
            <div className="feature-card">
              <div className="feature-icon-wrapper purple">
                <Code2 style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>Proctored Sandbox IDE</h4>
                <p>Run TypeScript compiler methods instantly inside our customized split-pane code editor.</p>
              </div>
            </div>

            {/* ATS Card */}
            <div className="feature-card">
              <div className="feature-icon-wrapper amber">
                <FileText style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>ATS Intelligence Audit</h4>
                <p>Align resume details against keyword densities for target roles to scale hiring matches.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <CheckCircle2 style={{ width: '14px', height: '14px', color: '#0d9488' }} />
          <span>Used by software engineering candidates worldwide.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Glassmorphic White Auth Card */}
      <div className="auth-form-panel">
        <div className="premium-auth-card">
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(13, 148, 136, 0.06)',
              border: '1px solid rgba(13, 148, 136, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Shield style={{ width: '20px', height: '20px', color: '#0d9488' }} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '6px', fontFamily: 'Clash Display, Syne, sans-serif' }}>
              {isSignUp ? 'Create Cloud Account' : otpSent ? 'Verify OTP Code' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
              {isSignUp 
                ? 'Register to initialize credit limits and cloud sync history.'
                : otpSent 
                  ? `Enter the 6-digit code sent to ${email}`
                  : 'Access your saved proctored sessions and learning roadmaps.'
              }
            </p>
          </div>

          {/* Credentials Warning (Unconfigured Supabase) */}
          {!hasSupabaseConfig && (
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.12)',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>Supabase Config Offline</span>
                <span style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                  Database variables are not active. Tap "Use Offline Guest Mode" below to try all app features instantly.
                </span>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              border: '1px solid rgba(239, 68, 68, 0.18)',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <AlertCircle style={{ width: '15px', height: '15px', color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '11.5px', color: '#b91c1c', lineHeight: 1.3 }}>{errorMsg}</span>
            </div>
          )}

          {/* Social Authentication Row (Hide if verifying OTP) */}
          {hasSupabaseConfig && !otpSent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="social-btn"
                  title="Sign in with Google"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                </button>

                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  className="social-btn"
                  title="Sign in with GitHub"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ display: 'block', color: '#181717' }}>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="social-btn"
                  title="Sign in with Facebook"
                >
                  <svg width="18" height="18" fill="#1877F2" viewBox="0 0 24 24" style={{ display: 'block' }}>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0 0 0', gap: '10px' }}>
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Or continue with credentials</span>
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              </div>

              {/* Developer Configuration Assistance */}
              {errorMsg && errorMsg.includes("provider is not enabled") && (
                <div className="help-provider-card">
                  <strong>Fix Unsupported Provider</strong>: Log in to your <strong>Supabase Dashboard</strong> &rarr; <strong>Auth</strong> &rarr; <strong>Providers</strong>, expand <strong>Google</strong> / <strong>GitHub</strong>, toggle to <strong>Enabled</strong>, and paste your Developer Client Credentials.
                </div>
              )}
            </div>
          )}

          {/* FLOW A: OTP Code Verification UI */}
          {otpSent ? (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>6-Digit Verification Code</label>
                
                <div className="otp-inputs-grid">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={digit}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      onChange={(e) => handleOtpChange(e.target, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="otp-box"
                      pattern="\d*"
                      inputMode="numeric"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-teal"
                style={{ width: '100%' }}
              >
                {loading ? (
                  <span className="rotating-brain" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'pulseSoft 1.2s infinite ease-in-out' }} />
                ) : (
                  <>
                    Verify Code & Login
                    <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode(Array(6).fill(''));
                  }}
                  className="toggle-link-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || loading}
                  className="toggle-link-btn"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          ) : (
            /* FLOW B: Standard Password or OTP Initiation Forms */
            <form onSubmit={authMethod === 'password' ? handleSubmit : (e) => { e.preventDefault(); handleSendOtp(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {isSignUp && authMethod === 'password' && (
                <>
                  {/* Full Name */}
                  <div className="auth-input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sarah Jenkins"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="auth-input-field"
                    />
                    <User className="auth-input-icon" />
                  </div>

                  {/* Target Role */}
                  <div className="auth-input-group">
                    <label>Target Job Role</label>
                    <input
                      type="text"
                      required
                      placeholder="Senior React Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="auth-input-field"
                    />
                    <Briefcase className="auth-input-icon" />
                  </div>
                </>
              )}

              {/* Email Address */}
              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="candidate@hiremind.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input-field"
                />
                <Mail className="auth-input-icon" />
              </div>

              {/* Password field - Hide if in OTP initialization mode */}
              {authMethod === 'password' && (
                <div className="auth-input-group" style={{ position: 'relative' }}>
                  <label>Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input-field"
                  />
                  <Lock className="auth-input-icon" />
                  <button
                    type="button"
                    className="toggle-pass-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-teal"
                style={{ width: '100%', marginTop: '8px' }}
              >
                {loading ? (
                  <span className="rotating-brain" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'pulseSoft 1.2s infinite ease-in-out' }} />
                ) : (
                  <>
                    {authMethod === 'password' 
                      ? (isSignUp ? 'Create Cloud Account' : 'Sign In To Dashboard') 
                      : 'Send OTP Verification Code'
                    }
                    <ArrowRight style={{ width: '14px', height: '14px' }} />
                  </>
                )}
              </button>

              {/* Toggle Login Option (OTP vs Password) - Only when signing in */}
              {!isSignUp && (
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  {authMethod === 'password' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setErrorMsg(null);
                      }}
                      className="toggle-link-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <KeyRound style={{ width: '14px', height: '14px' }} />
                      Sign in with passwordless OTP Code
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('password');
                        setErrorMsg(null);
                      }}
                      className="toggle-link-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Lock style={{ width: '14px', height: '14px' }} />
                      Sign in with email & password
                    </button>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Toggle Mode Link (Sign Up vs Sign In) - Hide if verifying OTP */}
          {!otpSent && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', fontSize: '13px', color: '#475569' }}>
              <span>{isSignUp ? 'Already have an account?' : 'New to HireMind?'}</span>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  // Default signup to password method
                  setAuthMethod('password');
                  setErrorMsg(null);
                }}
                className="toggle-link-btn"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          )}

          {/* Separator / Guest Fallback (Hide if verifying OTP) */}
          {!otpSent && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '10px' }}>
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#cbd5e1' }} />
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline mode</span>
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: '#cbd5e1' }} />
              </div>

              <button
                onClick={handleGuestMode}
                className="offline-guest-btn"
              >
                <Sparkles style={{ width: '14px', height: '14px', color: '#4f46e5' }} />
                Use Offline Guest Mode (Local Storage)
              </button>
            </>
          )}

          {/* Cryptographic Password Security Tooltip Badge */}
          <div className="security-badge-card">
            <LockKeyhole style={{ width: '16px', height: '16px', color: '#4f46e5', flexShrink: 0 }} />
            <span style={{ fontSize: '10.5px', color: '#475569', lineHeight: 1.4 }}>
              <strong>Secure Encryption</strong>: All data is protected via SSL in transit. Passwords are Bcrypt hashed, and OTP transactions expire automatically.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
