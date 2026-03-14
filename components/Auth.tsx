import React, { useState } from 'react';
import { Mail, Lock, Loader2, Zap, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (resetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccessMsg('Password reset email sent! Check your inbox.');
        setResetMode(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        setSuccessMsg(
          'Account created! Check your email to confirm your address, then sign in.'
        );
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Background glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px',
          padding: '3rem 2.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              marginBottom: '1.25rem',
              boxShadow: '0 8px 24px rgba(14,165,233,0.4)',
            }}
          >
            <Zap size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            {resetMode
              ? 'Reset Password'
              : isLogin
              ? 'Welcome back'
              : 'Create account'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            {resetMode
              ? "We'll send you a reset link"
              : isLogin
              ? 'Sign in to your SalesOxe account'
              : 'Start finding leads today'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              color: '#86efac',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name field (signup only) */}
          {!isLogin && !resetMode && (
            <div>
              <label
                style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label
              style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#64748b"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          </div>

          {/* Password */}
          {!resetMode && (
            <div>
              <label
                style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="#64748b"
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.875rem 3rem 0.875rem 2.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0ea5e9')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              padding: '0.9rem',
              background: loading
                ? 'rgba(14,165,233,0.4)'
                : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s, transform 0.1s',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
            }}
            onMouseEnter={(e) => !loading && ((e.target as HTMLElement).style.opacity = '0.9')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : resetMode ? (
              'Send Reset Link'
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {resetMode ? (
            <button
              onClick={() => { setResetMode(false); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              ← Back to sign in
            </button>
          ) : (
            <button
              id="auth-toggle-btn"
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.875rem', cursor: 'pointer' }}
            >
              {isLogin ? (
                <>Don't have an account?{' '}<span style={{ color: '#0ea5e9', fontWeight: 600 }}>Sign up free</span></>
              ) : (
                <>Already have an account?{' '}<span style={{ color: '#0ea5e9', fontWeight: 600 }}>Sign in</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
