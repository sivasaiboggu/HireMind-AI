import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase, hasSupabaseConfig } from '../services/supabase';
import { Shield, Mail, Lock, User, Briefcase, ChevronRight, AlertCircle, Sparkles, LogIn, ArrowRight } from 'lucide-react';
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
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!hasSupabaseConfig) {
      addToast('error', 'Supabase parameters are not configured. Click "Use Offline Guest Mode" below to proceed!');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Candidate',
              target_role: targetRole.trim() || 'Software Engineer'
            }
          }
        });

        if (error) throw error;
        
        if (data.session) {
          addToast('success', 'Account registered and logged in successfully!');
          navigate('/dashboard');
        } else {
          addToast('success', 'Registration successful! Please check your email for verification.');
          setIsSignUp(false);
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        addToast('success', 'Logged in successfully.');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      addToast('error', err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setGuestMode(true);
    addToast('info', 'Entered platform in Offline Guest Mode. Data will be saved locally.');
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#030712',
      color: '#f3f4f6',
      fontFamily: 'var(--font-body)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 212, 170, 0.08)',
        filter: 'blur(100px)',
        top: '-100px',
        left: '-100px',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        filter: 'blur(100px)',
        bottom: '-100px',
        right: '-100px',
        zIndex: 0
      }} />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        zIndex: 0
      }} />

      {/* Glassmorphic Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Logo and Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            border: '1px solid rgba(0, 212, 170, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Shield style={{ width: '24px', height: '24px', color: '#00d4aa' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', marginBottom: '8px' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '300px', lineHeight: 1.5 }}>
            {isSignUp 
              ? 'Join HireMind AI to evaluate your resume, practice coding IDE challenges, and mock interview with recruiters.'
              : 'Sign in to access your proctored mock interview history and resume performance checklists.'
            }
          </p>
        </div>

        {/* Warning if Supabase is unconfigured */}
        {!hasSupabaseConfig && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.06)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <AlertCircle style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>Supabase Config Offline</span>
              <span style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.4 }}>
                Variables are not set. You can test in Local Storage mode by selecting "Use Offline Guest Mode".
              </span>
            </div>
          </div>
        )}

        {/* Error Block */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isSignUp && (
            <>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: '#6b7280' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(5, 10, 15, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px 12px 42px',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'border 150ms ease'
                    }}
                  />
                </div>
              </div>

              {/* Target Job Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Target Job Role</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: '#6b7280' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead React Architect"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(5, 10, 15, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px 12px 42px',
                      fontSize: '13px',
                      color: '#fff',
                      outline: 'none',
                      transition: 'border 150ms ease'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: '#6b7280' }} />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(5, 10, 15, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px 12px 42px',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'border 150ms ease'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '14px', top: '13px', width: '16px', height: '16px', color: '#6b7280' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(5, 10, 15, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px 16px 12px 42px',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'border 150ms ease'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#00d4aa',
              color: '#030712',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              transition: 'opacity 150ms ease'
            }}
            className="btn-press"
          >
            {loading ? (
              <span className="rotating-brain" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #030712', borderTopColor: 'transparent', borderRadius: '50%' }} />
            ) : (
              <>
                {isSignUp ? 'Register & Start' : 'Sign In'}
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </>
            )}
          </button>
        </form>

        {/* Toggle between Sign In / Sign Up */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
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

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
          <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
          <div style={{ flexGrow: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Guest Mode Action */}
        <button
          onClick={handleGuestMode}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: '#d1d5db',
            padding: '12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          className="btn-press"
        >
          <Sparkles style={{ width: '14px', height: '14px', color: '#a855f7' }} />
          Use Offline Guest Mode
        </button>

      </div>
    </div>
  );
};
export default Auth;
