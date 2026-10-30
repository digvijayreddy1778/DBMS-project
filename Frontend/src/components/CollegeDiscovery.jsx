import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE } from '../config'; // <-- Centralized config import

export default function CollegeDiscovery({ user }) {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [inputType, setInputType] = useState('rank'); 
    const [portalNode, setPortalNode] = useState(null);
    
    const [formData, setFormData] = useState({
        category: 'OPEN',
        gender: 'Gender-Neutral',
        homeState: 'All States',
        instituteType: 'ALL',
        rank: '',
        percentile: '',
        totalApplicants: 1400000,
        round: 6
    });
    
    const [results, setResults] = useState([]);
    const [savedChoices, setSavedChoices] = useState([]);
    const [comparedColleges, setComparedColleges] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [activeChartId, setActiveChartId] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        setPortalNode(document.getElementById('navbar-portal-target'));
        if (user && user.id) {
            fetch(`${API_BASE}/api/cart/${user.id}`)
                .then(res => res.json())
                .then(data => setSavedChoices(data))
                .catch(err => console.error("Error loading cart:", err));
        }
    }, [user]);

    const getComputedRank = () => {
        if (inputType === 'percentile' && formData.percentile) {
            return Math.max(1, Math.round(((100 - parseFloat(formData.percentile)) / 100) * parseInt(formData.totalApplicants)));
        }
        return parseInt(formData.rank) || 0;
    };

    const fetchColleges = async (currentPage, overrideRound = null) => {
        const targetRank = getComputedRank();
        if (!targetRank) return;

        setLoading(true);
        setError('');
        setActiveChartId(null);
        
        const currentRound = overrideRound !== null ? overrideRound : formData.round;

        try {
            const response = await fetch(`${API_BASE}/api/discover-colleges`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, rank: targetRank, round: currentRound, page: currentPage, limit: 50 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to fetch colleges');
            setResults(data.results);
            setPage(currentPage);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchColleges(1); 
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoundChange = (e) => {
        const newRound = parseInt(e.target.value);
        setFormData({ ...formData, round: newRound });
        if (getComputedRank() > 0) fetchColleges(1, newRound); 
    };

    const handlePillClick = (type) => {
        setFormData({ ...formData, instituteType: type });
        if (getComputedRank() > 0) setTimeout(() => fetchColleges(1), 100);
    };

    const toggleChoice = async (course) => {
        const isSaved = savedChoices.some(c => c.institute === course.institute && c.program === course.program);
        if (isSaved) {
            try {
                await fetch(`${API_BASE}/api/cart`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, institute: course.institute, program: course.program })
                });
                setSavedChoices(savedChoices.filter(c => !(c.institute === course.institute && c.program === course.program)));
            } catch (err) { console.error("Failed to remove", err); }
        } else {
            try {
                const response = await fetch(`${API_BASE}/api/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id, institute: course.institute, program: course.program,
                        quota: course.quota, median_cutoff: course.median_cutoff, distance_km: course.distance_km
                    })
                });
                if (response.ok) {
                    const newSavedChoice = await response.json();
                    setSavedChoices([...savedChoices, newSavedChoice]);
                }
            } catch (err) { console.error("Failed to save", err); }
        }
    };

    const toggleCompare = (course) => {
        const isCompared = comparedColleges.some(c => c.institute === course.institute && c.program === course.program);
        if (isCompared) setComparedColleges(comparedColleges.filter(c => !(c.institute === course.institute && c.program === course.program)));
        else {
            if (comparedColleges.length >= 3) return alert("You can compare up to 3 colleges at a time.");
            setComparedColleges([...comparedColleges, course]);
        }
    };

    const toggleChart = async (course, index) => {
        if (activeChartId === index) return setActiveChartId(null);
        setActiveChartId(index);
        setChartLoading(true);
        setChartData([]);
        try {
            const response = await fetch(`${API_BASE}/api/trends`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institute: course.institute, program: course.program, category: formData.category, gender: formData.gender, quota: course.quota })
            });
            const data = await response.json();
            if (response.ok) setChartData(data);
        } catch (err) { console.error(err); } 
        finally { setChartLoading(false); }
    };

    const t = isDarkMode ? {
        base: '#020617', card: '#0f172a', input: '#020617', border: '#1e293b',
        textMain: '#f8fafc', textSub: '#94a3b8', primary: '#3b82f6', 
        hero: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)', heroText: '#f8fafc',
        shadow: '0 10px 20px rgba(0,0,0,0.4)',
        bandSafeBg: 'rgba(22, 163, 74, 0.15)', bandSafeText: '#4ade80', bandSafeBorder: '#16a34a',
        bandTargetBg: 'rgba(202, 138, 4, 0.15)', bandTargetText: '#facc15', bandTargetBorder: '#ca8a04',
        bandReachBg: 'rgba(220, 38, 38, 0.15)', bandReachText: '#f87171', bandReachBorder: '#dc2626'
    } : {
        base: '#f1f5f9', card: '#ffffff', input: '#ffffff', border: '#cbd5e1',
        textMain: '#0f172a', textSub: '#475569', primary: '#2563eb', 
        hero: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', heroText: '#ffffff',
        shadow: '0 4px 15px rgba(0,0,0,0.05)',
        bandSafeBg: '#dcfce7', bandSafeText: '#16a34a', bandSafeBorder: '#bbf7d0',
        bandTargetBg: '#fef9c3', bandTargetText: '#ca8a04', bandTargetBorder: '#fef08a',
        bandReachBg: '#fee2e2', bandReachText: '#dc2626', bandReachBorder: '#fecaca'
    };

    const getBandStyle = (band) => {
        if (band === 'Safe') return { bg: t.bandSafeBg, text: t.bandSafeText, border: t.bandSafeBorder }; 
        if (band === 'Target') return { bg: t.bandTargetBg, text: t.bandTargetText, border: t.bandTargetBorder }; 
        return { bg: t.bandReachBg, text: t.bandReachText, border: t.bandReachBorder }; 
    };

    const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${t.border}`, outline: 'none', fontSize: '0.95rem', color: t.textMain, backgroundColor: t.input, boxSizing: 'border-box', transition: 'border-color 0.2s' };
    const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: t.textSub, marginBottom: '8px' };

    return (
        <div style={{ backgroundColor: t.base, minHeight: '100vh', paddingBottom: '100px', color: t.textMain, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', width: '100vw', overflowX: 'hidden' }}>
            
            {portalNode && createPortal(
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Eligibility State:</span>
                        <strong style={{ color: '#f8fafc' }}>{formData.homeState}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Category:</span>
                        <strong style={{ color: '#f8fafc' }}>{formData.category}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Target Rank:</span>
                        <strong style={{ color: '#3b82f6' }}>{getComputedRank() || 'Not Set'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cart Items:</span>
                        <strong style={{ color: '#10b981' }}>{savedChoices.length} saved</strong>
                    </div>
                </div>,
                portalNode
            )}

            {/* HERO SECTION */}
            <div style={{ background: t.hero, padding: '50px 20px', textAlign: 'center', borderBottom: `1px solid ${t.border}`, position: 'relative' }}>
                <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ position: 'absolute', top: '20px', right: '20px', background: t.card, border: `1px solid ${t.border}`, color: t.textMain, padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
                <h1 style={{ color: t.heroText, fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0' }}>Find Top Engineering Colleges in India</h1>
                <p style={{ color: isDarkMode ? '#94a3b8' : '#bfdbfe', fontSize: '1.1rem', margin: '0' }}>Enter your rank to discover cutoffs, trends, and admission chances instantly.</p>
            </div>

            {/* SEARCH PANEL */}
            <div style={{ maxWidth: '1400px', margin: '40px auto 0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
                
                <div style={{ backgroundColor: t.card, padding: '32px', borderRadius: '12px', boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end' }}>
                        <div style={{ gridColumn: inputType === 'percentile' ? 'span 2' : 'span 1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ ...labelStyle, margin: 0 }}>{inputType === 'rank' ? 'Your Rank' : 'Your Percentile'}</label>
                                <div style={{ display: 'flex', backgroundColor: t.base, borderRadius: '6px', padding: '2px', border: `1px solid ${t.border}` }}>
                                    <button type="button" onClick={() => setInputType('rank')} style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: inputType === 'rank' ? t.border : 'transparent', color: inputType === 'rank' ? t.textMain : t.textSub }}>Rank</button>
                                    <button type="button" onClick={() => setInputType('percentile')} style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: inputType === 'percentile' ? t.border : 'transparent', color: inputType === 'percentile' ? t.textMain : t.textSub }}>Percentile</button>
                                </div>
                            </div>
                            {inputType === 'rank' ? (
                                <input type="number" name="rank" value={formData.rank} onChange={handleChange} required min="1" placeholder="Enter JEE/NEET Rank" style={{...inputStyle, border: `1px solid ${t.primary}`}} />
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input type="number" name="percentile" value={formData.percentile} onChange={handleChange} required min="0" max="100" step="0.000001" placeholder="e.g. 98.5" style={{...inputStyle, border: `1px solid ${t.primary}`, flex: 1}} />
                                        <input type="number" name="totalApplicants" value={formData.totalApplicants} onChange={handleChange} required min="100000" placeholder="Total Applicants" style={{...inputStyle, flex: 1}} />
                                    </div>
                                    {formData.percentile && <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#4ade80', fontWeight: '700' }}>Estimated Rank: {getComputedRank().toLocaleString()}</p>}
                                </div>
                            )}
                        </div>

                        {/* FULL LIST OF ALL INDIAN STATES */}
                        <div>
                            <label style={labelStyle}>State of Eligibility</label>
                            <select name="homeState" value={formData.homeState} onChange={handleChange} style={inputStyle}>
                                <option value="All States">All States</option>
                                <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                <option value="Assam">Assam</option>
                                <option value="Bihar">Bihar</option>
                                <option value="Chandigarh">Chandigarh</option>
                                <option value="Chhattisgarh">Chhattisgarh</option>
                                <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Goa">Goa</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Haryana">Haryana</option>
                                <option value="Himachal Pradesh">Himachal Pradesh</option>
                                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                <option value="Jharkhand">Jharkhand</option>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Kerala">Kerala</option>
                                <option value="Ladakh">Ladakh</option>
                                <option value="Lakshadweep">Lakshadweep</option>
                                <option value="Madhya Pradesh">Madhya Pradesh</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Manipur">Manipur</option>
                                <option value="Meghalaya">Meghalaya</option>
                                <option value="Mizoram">Mizoram</option>
                                <option value="Nagaland">Nagaland</option>
                                <option value="Odisha">Odisha</option>
                                <option value="Puducherry">Puducherry</option>
                                <option value="Punjab">Punjab</option>
                                <option value="Rajasthan">Rajasthan</option>
                                <option value="Sikkim">Sikkim</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Telangana">Telangana</option>
                                <option value="Tripura">Tripura</option>
                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                                <option value="Uttarakhand">Uttarakhand</option>
                                <option value="West Bengal">West Bengal</option>
                                <option value="Outside India / None">Outside India / None</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                                <option value="OPEN">OPEN (General)</option>
                                <option value="OBC-NCL">OBC-NCL</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                                <option value="EWS">EWS</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: t.base, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <label style={{ fontSize: '0.95rem', fontWeight: '700', color: t.primary, margin: 0 }}>What-If Round Analyzer</label>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>Round {formData.round}</span>
                            </div>
                            <input type="range" min="1" max="6" name="round" value={formData.round} onChange={handleRoundChange} style={{ width: '100%', cursor: 'pointer', accentColor: t.primary }} />
                        </div>

                        <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', padding: '14px', background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.05rem', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.2s', height: '50px' }}>
                            {loading ? 'Simulating...' : 'Search Colleges'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${t.border}`, overflowX: 'auto' }}>
                        {['ALL', 'IIT', 'NIT', 'IIIT'].map(type => (
                            <button key={type} onClick={() => handlePillClick(type)} type="button" style={{ padding: '8px 20px', whiteSpace: 'nowrap', backgroundColor: formData.instituteType === type ? t.primary : t.base, color: formData.instituteType === type ? 'white' : t.textSub, border: `1px solid ${formData.instituteType === type ? t.primary : t.border}`, borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                                {type === 'ALL' ? 'All Institutes' : `Top ${type}s`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1400px', margin: '40px auto 0 auto', padding: '0 20px' }}>
                {error && <p style={{ color: '#f87171', textAlign: 'center', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid #dc2626' }}><strong>Error:</strong> {error}</p>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {results.map((course, index) => {
                        const bandStyle = getBandStyle(course.band);
                        const isSaved = savedChoices.some(c => c.institute === course.institute && c.program === course.program);
                        
                        let volBg = 'rgba(251, 191, 36, 0.1)'; let volText = '#fbbf24'; let volBorder = '#ca8a04';
                        if (course.volatility_percent < 5) { volBg = 'rgba(22, 163, 74, 0.1)'; volText = '#4ade80'; volBorder = '#16a34a'; }
                        else if (course.volatility_percent > 15) { volBg = 'rgba(220, 38, 38, 0.1)'; volText = '#f87171'; volBorder = '#dc2626'; }

                        return (
                            <div key={index} style={{ backgroundColor: t.card, borderRadius: '12px', border: `1px solid ${t.border}`, overflow: 'hidden', boxShadow: t.shadow, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ backgroundColor: t.base, padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: bandStyle.bg, color: bandStyle.text, border: `1px solid ${bandStyle.border}` }}>{course.band} Match</span>
                                        <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: volBg, color: volText, border: `1px solid ${volBorder}` }}>{course.volatility_label} ({course.volatility_percent}%)</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: t.textSub, backgroundColor: t.border, padding: '4px 8px', borderRadius: '4px' }}>Quota: {course.quota}</span>
                                </div>

                                <div style={{ padding: '20px', flexGrow: 1 }}>
                                    <h4 style={{ margin: '0 0 12px 0', color: t.textMain, fontSize: '1.1rem', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                        <span>{course.institute}</span>
                                        {course.website_url && (
                                            <a href={course.website_url.startsWith('http') ? course.website_url : `https://${course.website_url}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '4px 8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.3)' }}>🌐 Visit</a>
                                        )}
                                    </h4>
                                    <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: t.textSub, lineHeight: '1.5', fontWeight: '500' }}>{course.program}</p>
                                    
                                    <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: t.textSub }}>
                                        <div><span style={{opacity: 0.8}}>✈️</span> {course.distance_km ? `Approx. ${course.distance_km.toLocaleString()} km from ${formData.homeState}` : 'Distance unavailable'}</div>
                                        {course.active_savers > 0 && (
                                            <div style={{ color: '#f97316', fontWeight: 'bold' }}>
                                                <span>🔥</span> {course.active_savers} {course.active_savers === 1 ? 'student has' : 'others have'} this on their list
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ backgroundColor: t.base, padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${t.border}` }}>
                                        <span style={{ fontSize: '0.85rem', color: t.textSub, fontWeight: '600' }}>Cutoff (Round {formData.round})</span>
                                        <strong style={{ fontSize: '1.2rem', color: t.textMain }}>{course.median_cutoff}</strong>
                                    </div>
                                </div>
                                <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: '10px' }}>
                                    <button onClick={() => toggleChoice(course)} style={{ flex: 1, padding: '10px', backgroundColor: isSaved ? t.border : t.base, color: isSaved ? t.textSub : t.primary, border: `1px solid ${isSaved ? t.border : t.primary}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>{isSaved ? '✓ Saved' : '+ Add to Dashboard'}</button>
                                </div>
                                <button onClick={() => toggleChart(course, index)} style={{ width: '100%', padding: '12px', backgroundColor: t.base, borderTop: `1px solid ${t.border}`, borderBottom: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', color: t.primary, fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                    {activeChartId === index ? 'Close Analytics ▲' : 'View Trends ▼'}
                                </button>
                                {activeChartId === index && (
                                    <div style={{ padding: '20px', height: '200px', backgroundColor: t.base, borderTop: `1px solid ${t.border}` }}>
                                        {chartLoading ? <p style={{ textAlign: 'center', color: t.textSub }}>Loading...</p> : chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.border} />
                                                    <XAxis dataKey="year" tick={{fontSize: 11, fill: t.textSub}} />
                                                    <YAxis reversed tick={{fontSize: 11, fill: t.textSub}} domain={['dataMin - 500', 'dataMax + 500']} />
                                                    <Tooltip contentStyle={{ backgroundColor: t.card, border: `1px solid ${t.border}`, color: t.textMain }} />
                                                    <Line type="monotone" dataKey="closing_rank" stroke={t.primary} strokeWidth={3} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : <p style={{ textAlign: 'center', color: t.textSub }}>No data available.</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}