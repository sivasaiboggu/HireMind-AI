import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase, hasSupabaseConfig } from '../services/supabase';
import { 
  Shield, Mail, Lock, User, Briefcase, AlertCircle, Sparkles, 
  ArrowRight, Brain, Code2, FileText, CheckCircle2, LockKeyhole, Eye, EyeOff 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { addToast, setGuestMode } = useAppStore();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          addToast('success', 'Registration successful! Verification link sent to your email.');
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
    @keyframes meshFloat {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(40px, -60px) scale(1.15); }
      66% { transform: translate(-30px, 30px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes cardPulse {
      0% { box-shadow: 0 0 40px rgba(0, 212, 170, 0.1); }
      50% { box-shadow: 0 0 50px rgba(129, 140, 248, 0.15); }
      100% { box-shadow: 0 0 40px rgba(0, 212, 170, 0.1); }
    }
    @keyframes textGlow {
      0% { text-shadow: 0 0 10px rgba(0, 212, 170, 0.2); }
      50% { text-shadow: 0 0 20px rgba(0, 212, 170, 0.4); }
      100% { text-shadow: 0 0 10px rgba(0, 212, 170, 0.2); }
    }
    @keyframes borderRotate {
      0% { border-color: rgba(0, 212, 170, 0.15); }
      50% { border-color: rgba(129, 140, 248, 0.3); }
      100% { border-color: rgba(0, 212, 170, 0.15); }
    }
    @keyframes floatMini {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
      100% { transform: translateY(0px); }
    }
    @keyframes waveSimulate {
      0%, 100% { height: 8px; }
      50% { height: 24px; }
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
        linear-gradient(rgba(0, 212, 170, 0.008) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 170, 0.008) 1px, transparent 1px);
      background-size: 32px 32px, 64px 64px, 64px 64px;
      z-index: 0;
    }

    .mesh-1 {
      position: absolute;
      width: 650px;
      height: 650px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 212, 170, 0.08) 0%, transparent 70%);
      filter: blur(90px);
      animation: meshFloat 20s infinite ease-in-out alternate;
      top: -150px;
      left: -200px;
      z-index: 0;
    }
    .mesh-2 {
      position: absolute;
      width: 700px;
      height: 700px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(129, 140, 248, 0.07) 0%, transparent 70%);
      filter: blur(100px);
      animation: meshFloat 25s infinite ease-in-out alternate-reverse;
      bottom: -200px;
      right: -150px;
      z-index: 0;
    }

    .auth-split-container {
      display: flex;
      min-height: 100vh;
      width: 100vw;
      background-color: #030712;
      color: #f3f4f6;
      font-family: 'DM Sans', sans-serif;
      position: relative;
      overflow: hidden;
    }

    .auth-showcase-panel {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
      background: linear-gradient(180deg, rgba(3, 7, 18, 0.9) 0%, rgba(10, 15, 26, 0.95) 100%);
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
      backdrop-filter: blur(8px);
    }

    .showcase-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 212, 170, 0.06);
      border: 1px solid rgba(0, 212, 170, 0.15);
      color: #00d4aa;
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
      color: #fff;
      margin-bottom: 18px;
    }

    .showcase-title span {
      background: linear-gradient(90deg, #00d4aa 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: textGlow 4s infinite ease-in-out;
    }

    .showcase-desc {
      font-size: 15px;
      color: #94a3b8;
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
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      gap: 18px;
      align-items: flex-start;
      transition: all 300ms ease;
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(0, 212, 170, 0.15);
      transform: translateX(6px);
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
      background: rgba(0, 212, 170, 0.08);
      border: 1px solid rgba(0, 212, 170, 0.15);
      color: #00d4aa;
    }

    .feature-icon-wrapper.purple {
      background: rgba(129, 140, 248, 0.08);
      border: 1px solid rgba(129, 140, 248, 0.15);
      color: #818cf8;
    }

    .feature-icon-wrapper.amber {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.15);
      color: #f59e0b;
    }

    .feature-details h4 {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }

    .feature-details p {
      font-size: 12.5px;
      color: #94a3b8;
      line-height: 1.5;
    }

    /* Recruiter Avatars simulation */
    .avatar-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.03);
      padding: 4px 8px;
      border-radius: 100px;
      border: 1px solid rgba(255,255,255,0.05);
      font-size: 11px;
      font-weight: 500;
      color: #e2e8f0;
      margin-top: 8px;
      display: inline-flex;
    }
    .avatar-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00d4aa;
      box-shadow: 0 0 8px #00d4aa;
    }

    .showcase-footer {
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Auth card right column */
    .premium-auth-card {
      width: 100%;
      maxWidth: 460px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 15, 30, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 28px;
      padding: 40px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: cardPulse 8s infinite ease-in-out, borderRotate 6s infinite ease-in-out;
      transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .premium-auth-card:hover {
      border-color: rgba(255,255,255,0.12);
    }

    .auth-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      position: relative;
    }

    .auth-input-field {
      width: 100%;
      background: rgba(5, 10, 15, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.07) !important;
      border-radius: 14px !important;
      color: #fff !important;
      padding: 13px 16px 13px 44px !important;
      font-size: 13.5px !important;
      transition: all 200ms ease !important;
      outline: none !important;
    }

    .auth-input-field:focus {
      border-color: rgba(0, 212, 170, 0.45) !important;
      box-shadow: 0 0 12px rgba(0, 212, 170, 0.15) !important;
      background: rgba(5, 10, 15, 0.8) !important;
    }

    .auth-input-icon {
      position: absolute;
      left: 15px;
      top: 36px;
      width: 17px;
      height: 17px;
      color: #6b7280;
      transition: color 200ms ease;
    }

    .auth-input-field:focus + .auth-input-icon,
    .auth-input-group:focus-within .auth-input-icon {
      color: #00d4aa;
    }

    .social-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.07);
      cursor: pointer;
      transition: all 200ms ease;
    }

    .social-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .social-btn:active {
      transform: translateY(0);
    }

    .btn-glow-cyan {
      background: linear-gradient(135deg, #00d4aa 0%, #00bfa0 100%);
      color: #030712;
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
      box-shadow: 0 4px 20px rgba(0, 212, 170, 0.25);
      transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-glow-cyan:hover {
      opacity: 0.95;
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 212, 170, 0.35);
    }

    .btn-glow-cyan:active {
      transform: translateY(0);
    }

    .btn-glow-cyan:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .offline-guest-btn {
      width: 100%;
      background: rgba(129, 140, 248, 0.04);
      border: 1px solid rgba(129, 140, 248, 0.12);
      border-radius: 14px;
      color: #a5b4fc;
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
      background: rgba(129, 140, 248, 0.08);
      border-color: rgba(129, 140, 248, 0.25);
      color: #fff;
    }

    .security-badge-card {
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.03);
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
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 5px;
      transition: color 150ms ease;
    }

    .toggle-pass-btn:hover {
      color: #e2e8f0;
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
      
      {/* Background elements */}
      <div className="bg-grid" />
      <div className="mesh-1" />
      <div className="mesh-2" />

      {/* LEFT COLUMN: Premium Showcase Panel */}
      <div className="auth-showcase-panel">
        <div>
          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00d4aa 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Brain style={{ width: '20px', height: '20px', color: '#030712' }} />
            </div>
            <span style={{
              fontFamily: 'Clash Display, Syne, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#fff'
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
            An advanced platform combining interactive neural recruiters, multi-file code sandbox execution compilers, and live ATS resume structure grading.
          </p>

          <div className="features-stack">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper cyan">
                <Brain style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>Interactive Recruiter Characters</h4>
                <p>Nodding, speaking, and typing recruiters simulating real-time human interaction.</p>
                <div className="avatar-pill">
                  <span className="avatar-dot" />
                  Sophia, Marcus & Emily Online
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper purple">
                <Code2 style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>Proctored Sandbox IDE</h4>
                <p>Compile TypeScript algorithms instantly inside our custom split-screen compiler.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper amber">
                <FileText style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="feature-details">
                <h4>ATS Intelligence Audit</h4>
                <p>Compare resume sections against target job descriptions for high-affinity keyword scoring.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <CheckCircle2 style={{ width: '14px', height: '14px', color: '#00d4aa' }} />
          <span>Used by software engineering candidates worldwide.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Glassmorphic Auth Form Panel */}
      <div className="auth-form-panel">
        <div className="premium-auth-card">
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: 'rgba(0, 212, 170, 0.06)',
              border: '1px solid rgba(0, 212, 170, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Shield style={{ width: '20px', height: '20px', color: '#00d4aa' }} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '6px', fontFamily: 'Clash Display, Syne, sans-serif' }}>
              {isSignUp ? 'Create Cloud Account' : 'Welcome back'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.4 }}>
              {isSignUp 
                ? 'Register to initialize credit limits and cloud sync history.'
                : 'Sign in to access your saved proctored sessions and roadmaps.'
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
              <AlertCircle style={{ width: '16px', height: '16px', color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>Supabase Config Offline</span>
                <span style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  Database credentials are not active. Tap "Use Offline Guest Mode" below to try all app features instantly.
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
              <span style={{ fontSize: '11.5px', color: '#fca5a5', lineHeight: 1.3 }}>{errorMsg}</span>
            </div>
          )}

          {/* Social Authentication Row */}
          {hasSupabaseConfig && (
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
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ display: 'block', color: '#fff' }}>
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
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Or continue with credentials</span>
                <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {isSignUp && (
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

            {/* Password */}
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

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="btn-glow-cyan"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? (
                <span className="rotating-brain" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #030712', borderTopColor: 'transparent', borderRadius: '50%', animation: 'voicePulse 1.2s infinite ease-in-out' }} />
              ) : (
                <>
                  {isSignUp ? 'Create Cloud Account' : 'Sign In To Dashboard'}
                  <ArrowRight style={{ width: '14px', height: '14px' }} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode Link */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
            <span>{isSignUp ? 'Already have an account?' : 'New to HireMind?'}</span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#00d4aa',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          {/* Separator / Guest Fallback */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '10px' }}>
            <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline mode</span>
            <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </div>

          <button
            onClick={handleGuestMode}
            className="offline-guest-btn"
          >
            <Sparkles style={{ width: '14px', height: '14px' }} />
            Use Offline Guest Mode (Local Storage)
          </button>

          {/* Cryptographic Password Security Tooltip Badge */}
          <div className="security-badge-card">
            <LockKeyhole style={{ width: '16px', height: '16px', color: '#818cf8', flexShrink: 0 }} />
            <span style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
              <strong>Bcrypt Protected</strong>: Your passwords are encrypted client-to-server and cryptographically hashed before database persistence. Even system administrators cannot view your raw password.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
