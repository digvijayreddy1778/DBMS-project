import { useState } from 'react';

export default function Auth({ onLoginSuccess }) {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isSignup ? '/api/signup' : '/api/login';

        try {
            const response = await fetch(`https://dbms-project-b9vv.onrender.com${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Authentication failed');

            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            
            {/* LEFT PANEL: Branding & Visuals (Gradient Background) */}
            <div style={{ 
                flex: 1, 
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                padding: '60px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background circle */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ backgroundColor: '#3b82f6', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.8rem', marginBottom: '24px', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)' }}>
                        E
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 16px 0', lineHeight: '1.1', letterSpacing: '-1px' }}>
                        Navigate your <br/><span style={{ color: '#60a5fa' }}>future.</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6' }}>
                        EduCompass Pro leverages 10 years of historical JoSAA data to predict, filter, and optimize your engineering admission strategy.
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL: Authentication Form */}
            <div style={{ flex: 1, backgroundColor: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                <div style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                        {isSignup ? 'Create an account' : 'Welcome back'}
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '32px' }}>
                        {isSignup ? 'Start discovering your target colleges today.' : 'Please enter your details to sign in.'}
                    </p>

                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '12px 16px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '24px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Email</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="Enter your email"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }} 
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box', fontSize: '1rem', transition: 'border-color 0.2s', outline: 'none' }} 
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            style={{ 
                                padding: '14px', 
                                backgroundColor: loading ? '#93c5fd' : '#2563eb', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: loading ? 'not-allowed' : 'pointer', 
                                fontWeight: '600', 
                                fontSize: '1rem',
                                marginTop: '8px',
                                transition: 'background-color 0.2s',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            {loading ? 'Processing...' : (isSignup ? 'Sign up' : 'Sign in')}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.9rem', color: '#64748b' }}>
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button 
                            onClick={() => { setIsSignup(!isSignup); setError(''); }} 
                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '600', padding: 0, textDecoration: 'none' }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                        >
                            {isSignup ? 'Log in' : 'Sign up for free'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}