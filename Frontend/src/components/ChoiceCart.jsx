import { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { API_BASE } from '../config'; // <-- Centralized config import

export default function ChoiceCart({ user }) {
    const [savedChoices, setSavedChoices] = useState([]);
    const [allottedSeat, setAllottedSeat] = useState(null);
    const [mockRank, setMockRank] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (user && user.id) {
            fetch(`${API_BASE}/api/cart/${user.id}`)
                .then(res => res.json())
                .then(data => setSavedChoices(data))
                .catch(err => console.error("Error loading cart:", err));
        }
    }, [user]);

    const toggleChoice = async (course) => {
        try {
            await fetch(`${API_BASE}/api/cart`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, institute: course.institute, program: course.program })
            });
            setSavedChoices(savedChoices.filter(c => !(c.institute === course.institute && c.program === course.program)));
            if (allottedSeat && allottedSeat.institute === course.institute && allottedSeat.program === course.program) {
                setAllottedSeat(null);
            }
        } catch (err) {
            console.error("Failed to remove", err);
        }
    };

    const handleSmartSort = () => {
        setSavedChoices([...savedChoices].sort((a, b) => a.median_cutoff - b.median_cutoff));
        setAllottedSeat(null); 
    };

    const handleDistanceSort = () => {
        setSavedChoices([...savedChoices].sort((a, b) => (a.distance_km || 99999) - (b.distance_km || 99999)));
        setAllottedSeat(null);
    };

    const runMockAllotment = () => {
        const currentRank = parseInt(mockRank);
        if (!currentRank || currentRank <= 0) return alert("Please enter your Rank to run the simulation.");
        
        let allotted = null;
        for (let i = 0; i < savedChoices.length; i++) {
            if (currentRank <= savedChoices[i].median_cutoff) { 
                allotted = savedChoices[i]; 
                break; 
            }
        }
        setAllottedSeat(allotted);
        if (!allotted) alert("Based on this list and your rank, no seats would be allotted.");
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        const element = document.getElementById('printable-cart');
        
        // Temporarily hide elements that shouldn't be in the PDF
        const noPrintElements = element.querySelectorAll('.no-print');
        noPrintElements.forEach(el => el.style.display = 'none');

        try {
            // Render the dashboard to an image
            const canvas = await html2canvas(element, { 
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: '#0f172a' // Match your dark theme card background
            });
            
            const imgData = canvas.toDataURL('image/png');
            
            // Create PDF and scale image to fit A4 page
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('EduCompass_Preference_Dashboard.pdf'); // Triggers direct save prompt
        } catch (error) {
            console.error("Error generating PDF", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            // Restore the hidden buttons
            noPrintElements.forEach(el => el.style.display = '');
            setIsDownloading(false);
        }
    };

    // Premium Dark Mode Theme for Dashboard
    const t = {
        base: '#020617', card: '#0f172a', input: '#020617', border: '#1e293b',
        textMain: '#f8fafc', textSub: '#94a3b8', primary: '#3b82f6', shadow: '0 10px 20px rgba(0,0,0,0.4)'
    };

    return (
        <div style={{ backgroundColor: t.base, minHeight: '100vh', padding: '40px 20px', color: t.textMain, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
            
            <div id="printable-cart" style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px', backgroundColor: t.card, borderRadius: '12px', boxShadow: t.shadow, border: `1px solid ${t.border}` }}>
                
                {/* DASHBOARD HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `2px solid ${t.border}`, paddingBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ margin: 0, color: t.textMain, fontSize: '1.8rem' }}>Your Preference Dashboard</h3>
                        <p style={{ margin: '4px 0 0 0', color: t.textSub, fontSize: '1rem' }}>You have {savedChoices.length} colleges ready for JoSAA counselling.</p>
                    </div>
                    
                    <div className="no-print" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        
                        {/* MOCK ALLOTMENT INPUT & BUTTON */}
                        <div style={{ display: 'flex', backgroundColor: t.base, borderRadius: '8px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
                            <input 
                                type="number" 
                                placeholder="Enter Target Rank" 
                                value={mockRank}
                                onChange={(e) => setMockRank(e.target.value)}
                                style={{ padding: '10px 12px', border: 'none', backgroundColor: 'transparent', color: t.textMain, outline: 'none', width: '140px' }}
                            />
                            <button onClick={runMockAllotment} style={{ padding: '10px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                🤖 Run Mock
                            </button>
                        </div>

                        <button onClick={handleDistanceSort} style={{ padding: '10px 16px', backgroundColor: 'transparent', color: '#a855f7', border: '1px solid #a855f7', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📍 Sort Distance</button>
                        <button onClick={handleSmartSort} style={{ padding: '10px 16px', backgroundColor: 'transparent', color: t.primary, border: `1px solid ${t.primary}`, borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🪄 Sort Cutoff</button>
                        
                        {/* DIRECT PDF DOWNLOAD BUTTON */}
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloading}
                            style={{ padding: '10px 16px', backgroundColor: '#334155', color: t.textMain, border: 'none', borderRadius: '8px', cursor: isDownloading ? 'wait' : 'pointer', fontWeight: 'bold' }}
                        >
                            {isDownloading ? '📥 Generating...' : '📥 Download PDF'}
                        </button>
                    </div>
                </div>

                {/* DASHBOARD TABLE */}
                {savedChoices.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ backgroundColor: t.base, borderBottom: `2px solid ${t.border}` }}>
                                    <th style={{ padding: '16px 12px', color: t.textSub }}>Pref #</th>
                                    <th style={{ padding: '16px 12px', color: t.textSub }}>Institute</th>
                                    <th style={{ padding: '16px 12px', color: t.textSub }}>Program</th>
                                    <th style={{ padding: '16px 12px', color: t.textSub }}>Distance</th>
                                    <th style={{ padding: '16px 12px', color: t.textSub }}>Cutoff</th>
                                    <th className="no-print" style={{ padding: '16px 12px', color: t.textSub }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {savedChoices.map((choice, index) => {
                                    const isAllotted = allottedSeat && allottedSeat.institute === choice.institute && allottedSeat.program === choice.program;
                                    return (
                                        <tr key={index} style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: isAllotted ? 'rgba(16, 185, 129, 0.15)' : 'transparent', transition: 'background-color 0.3s' }}>
                                            <td style={{ padding: '16px 12px', fontWeight: 'bold', color: t.textMain }}>{index + 1}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: '600', color: t.textMain }}>
                                                {choice.institute}
                                                {isAllotted && <span style={{ display: 'block', color: '#4ade80', fontSize: '0.8rem', marginTop: '4px' }}>★ Simulated Allotment Confirmed</span>}
                                            </td>
                                            <td style={{ padding: '16px 12px', color: t.textSub }}>{choice.program}</td>
                                            <td style={{ padding: '16px 12px', color: t.textSub }}>{choice.distance_km ? `${choice.distance_km} km` : 'N/A'}</td>
                                            <td style={{ padding: '16px 12px', fontWeight: 'bold', color: t.primary }}>{choice.median_cutoff}</td>
                                            <td className="no-print" style={{ padding: '16px 12px' }}>
                                                <button onClick={() => toggleChoice(choice)} style={{ padding: '6px 12px', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textSub }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🛒</span>
                        <h4 style={{ fontSize: '1.2rem', color: t.textMain, margin: '0 0 8px 0' }}>Your Dashboard is empty</h4>
                        <p style={{ margin: 0 }}>Go to the Discover Colleges tab to start adding your preferences.</p>
                    </div>
                )}
            </div>
        </div>
    );
}