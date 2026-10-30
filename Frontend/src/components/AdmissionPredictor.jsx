import { useState, useEffect } from 'react';
import { API_BASE } from '../config'; // <-- Centralized config import

export default function AdmissionPredictor({ user }) {
    const [institutes, setInstitutes] = useState([]);
    const [programs, setPrograms] = useState([]);
    
    const [formData, setFormData] = useState({
        institute: '',
        program: '',
        category: 'OPEN',
        gender: 'Gender-Neutral',
        rank: ''
    });

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch the list of all institutes on component mount
    useEffect(() => {
        const fetchInstitutes = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/institutes`);
                if (!response.ok) throw new Error('Failed to fetch institutes');
                const data = await response.json();
                setInstitutes(data);
            } catch (err) {
                console.error(err);
                setError('Could not load institutes from the database.');
            }
        };
        fetchInstitutes();
    }, []);

    // Fetch programs dynamically when the selected institute changes
    useEffect(() => {
        const fetchPrograms = async () => {
            if (!formData.institute) {
                setPrograms([]);
                return;
            }
            try {
                const response = await fetch(`${API_BASE}/api/programs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ institute: formData.institute })
                });
                if (!response.ok) throw new Error('Failed to fetch programs');
                const data = await response.json();
                setPrograms(data);
                // Reset program selection when institute changes
                setFormData(prev => ({ ...prev, program: '' }));
            } catch (err) {
                console.error(err);
            }
        };
        fetchPrograms();
    }, [formData.institute]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setPrediction(null); // Clear previous result when inputs change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.institute || !formData.program || !formData.rank) {
            setError("Please fill out all fields.");
            return;
        }

        setLoading(true);
        setError('');
        setPrediction(null);

        try {
            const response = await fetch(`${API_BASE}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institute: formData.institute,
                    program: formData.program,
                    category: formData.category,
                    gender: formData.gender,
                    rank: parseInt(formData.rank)
                })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to get prediction');
            
            setPrediction(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getBandColor = (band) => {
        if (band === 'Safe') return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0', icon: '✅' }; 
        if (band === 'Target') return { bg: '#fef9c3', text: '#ca8a04', border: '#fef08a', icon: '🎯' }; 
        if (band === 'Reach') return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca', icon: '⚠️' };
        return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', icon: 'ℹ️' };
    };

    const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', color: '#334155', backgroundColor: 'white', boxSizing: 'border-box', transition: 'border-color 0.2s' };
    const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#475569', marginBottom: '8px' };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
            
            {/* HERO BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '60px 20px 100px 20px', textAlign: 'center' }}>
                <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                    Specific College Predictor
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '0', fontWeight: '400' }}>
                    Select your dream college and branch to check your exact admission probability.
                </p>
            </div>

            {/* PREDICTION CONSOLE */}
            <div style={{ maxWidth: '800px', margin: '-60px auto 0 auto', padding: '0 20px' }}>
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        <div>
                            <label style={labelStyle}>1. Select Institute</label>
                            <select name="institute" value={formData.institute} onChange={handleChange} required style={inputStyle}>
                                <option value="">-- Choose an Institute --</option>
                                {institutes.map((inst, idx) => (
                                    <option key={idx} value={inst}>{inst}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>2. Select Program / Branch</label>
                            <select name="program" value={formData.program} onChange={handleChange} required disabled={!formData.institute} style={{...inputStyle, backgroundColor: !formData.institute ? '#f8fafc' : 'white', cursor: !formData.institute ? 'not-allowed' : 'pointer'}}>
                                <option value="">{formData.institute ? '-- Choose a Program --' : 'Select an institute first'}</option>
                                {programs.map((prog, idx) => (
                                    <option key={idx} value={prog}>{prog}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Social Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                                    <option value="OPEN">OPEN (General)</option>
                                    <option value="OBC-NCL">OBC-NCL</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="EWS">EWS</option>
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Gender Quota</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                                    <option value="Gender-Neutral">Gender-Neutral</option>
                                    <option value="Female-only (including Supernumerary)">Female-only</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>JEE/NEET Rank</label>
                            <input type="number" name="rank" value={formData.rank} onChange={handleChange} required min="1" placeholder="Enter your All India Rank" style={{...inputStyle, border: '2px solid #3b82f6', fontSize: '1.05rem'}} />
                        </div>

                        {error && <div style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}

                        <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)', transition: 'background-color 0.2s', marginTop: '10px' }}>
                            {loading ? 'Analyzing Data...' : 'Predict Admission Chance'}
                        </button>
                    </form>

                    {/* PREDICTION RESULT CARD */}
                    {prediction && (
                        <div style={{ marginTop: '40px', padding: '30px', border: `2px solid ${prediction.result ? '#e2e8f0' : getBandColor(prediction.band).border}`, borderRadius: '12px', backgroundColor: prediction.result ? '#f8fafc' : getBandColor(prediction.band).bg, textAlign: 'center', animation: 'fadeIn 0.5s ease-in-out' }}>
                            
                            {prediction.result ? (
                                // Case: No data found for this exact combo (e.g. Female-only ST didn't exist for a specific branch)
                                <div>
                                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤷🏽‍♂️</div>
                                    <h3 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>Data Not Available</h3>
                                    <p style={{ color: '#475569', margin: 0 }}>{prediction.result}</p>
                                </div>
                            ) : (
                                // Case: Prediction Successful
                                <div>
                                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
                                        {getBandColor(prediction.band).icon}
                                    </div>
                                    <h2 style={{ margin: '0 0 8px 0', color: getBandColor(prediction.band).text, fontSize: '2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        {prediction.band} Match
                                    </h2>
                                    <p style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                                        {prediction.message}
                                    </p>
                                    
                                    <div style={{ display: 'inline-flex', gap: '40px', backgroundColor: 'white', padding: '16px 32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Your Rank</span>
                                            <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>{formData.rank}</strong>
                                        </div>
                                        <div style={{ width: '2px', backgroundColor: '#e2e8f0' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Hist. Cutoff</span>
                                            <strong style={{ fontSize: '1.4rem', color: getBandColor(prediction.band).text }}>{prediction.medianCutoff}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Inline CSS animation for the result card */}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </div>
    );
}