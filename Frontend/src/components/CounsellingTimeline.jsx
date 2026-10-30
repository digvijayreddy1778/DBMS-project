import { useState, useEffect } from 'react';
import { API_BASE } from '../config'; // <-- Centralized config import

export default function CounsellingTimeline() {
    // Note: These dates are simulated. In production, you would fetch these from your PostgreSQL config table.
    const timelineEvents = [
        { id: 1, title: 'JEE Advanced Results Declared', date: '2026-06-09T10:00:00', description: 'Check your final All India Rank.' },
        { id: 2, title: 'Candidate Registration & Choice Filling Begins', date: '2026-06-10T10:00:00', description: 'Log in and start building your preference cart.' },
        { id: 3, title: 'Mock Seat Allocation 1', date: '2026-06-15T11:30:00', description: 'System simulates allocation based on choices filled so far.' },
        { id: 4, title: 'Mock Seat Allocation 2', date: '2026-06-17T10:00:00', description: 'Final mock allocation before choice locking.' },
        { id: 5, title: 'Choice Locking Ends', date: '2026-06-18T17:00:00', description: 'CRITICAL: Unlocked choices will be auto-locked.', isCritical: true },
        { id: 6, title: 'Round 1 Seat Allocation', date: '2026-06-20T10:00:00', description: 'First round of official JoSAA allotments.' },
        { id: 7, title: 'Round 1 Document Verification & Fee Payment', date: '2026-06-24T17:00:00', description: 'Upload documents and pay seat acceptance fee.', isCritical: true },
        { id: 8, title: 'Round 2 Seat Allocation', date: '2026-06-27T10:00:00', description: 'Second round of official allotments.' },
    ];

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update the current time every minute to keep the timeline live
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getEventStatus = (eventDateStr) => {
        const eventDate = new Date(eventDateStr);
        if (currentTime > eventDate) return 'completed';
        const diffDays = (eventDate - currentTime) / (1000 * 60 * 60 * 24);
        if (diffDays <= 2 && diffDays > 0) return 'upcoming'; // Within 48 hours
        return 'pending';
    };

    const formatDate = (dateStr) => {
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateStr).toLocaleDateString('en-IN', options);
    };

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '100px' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', padding: '60px 20px 80px 20px', textAlign: 'center' }}>
                <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                    JoSAA Action Timeline
                </h1>
                <p style={{ color: '#cbd5e1', fontSize: '1.1rem', margin: '0', fontWeight: '400' }}>
                    Track critical deadlines, mock allotments, and document verification windows.
                </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '-40px auto 0 auto', padding: '0 20px' }}>
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
                        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem' }}>Live Schedule</h2>
                        <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            Today: {currentTime.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '20px' }}>
                        {/* Vertical Track Line */}
                        <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '26px', width: '3px', backgroundColor: '#e2e8f0', zIndex: 0 }}></div>

                        {timelineEvents.map((item, index) => {
                            const status = getEventStatus(item.date);
                            let dotColor = '#cbd5e1'; // Pending
                            let textColor = '#64748b';
                            let boxBorder = 'transparent';

                            if (status === 'completed') {
                                dotColor = '#10b981'; // Green
                                textColor = '#94a3b8'; // Faded
                            } else if (status === 'upcoming') {
                                dotColor = '#f59e0b'; // Orange
                                textColor = '#0f172a';
                                boxBorder = '#fef3c7';
                            } else {
                                textColor = '#334155';
                            }

                            return (
                                <div key={item.id} style={{ display: 'flex', gap: '20px', marginBottom: '30px', position: 'relative', zIndex: 1, opacity: status === 'completed' ? 0.7 : 1 }}>
                                    
                                    {/* Timeline Dot */}
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: dotColor, border: '4px solid white', marginTop: '4px', boxShadow: '0 0 0 2px #f8fafc', flexShrink: 0 }}></div>
                                    
                                    {/* Event Content */}
                                    <div style={{ flex: 1, backgroundColor: status === 'upcoming' ? '#fffbeb' : 'white', border: `1px solid ${status === 'upcoming' ? '#fde68a' : '#f1f5f9'}`, padding: '16px 20px', borderRadius: '8px', transition: 'all 0.2s', boxShadow: status === 'upcoming' ? '0 4px 6px rgba(245, 158, 11, 0.1)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: textColor, fontWeight: '700', textDecoration: status === 'completed' ? 'line-through' : 'none' }}>
                                                {item.title}
                                            </h3>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: status === 'upcoming' ? '#d97706' : '#64748b', whiteSpace: 'nowrap' }}>
                                                {formatDate(item.date)}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: status === 'completed' ? '#94a3b8' : '#475569', lineHeight: '1.5' }}>
                                            {item.description}
                                        </p>
                                        
                                        {item.isCritical && status !== 'completed' && (
                                            <div style={{ marginTop: '10px', display: 'inline-block', backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                ⚠️ Critical Deadline
                                            </div>
                                        )}
                                        
                                        {status === 'upcoming' && (
                                            <div style={{ marginTop: '12px' }}>
                                                <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%', marginRight: '6px', animation: 'pulse 2s infinite' }}></span>
                                                <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: '600' }}>Action Required Soon</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes pulse {
                        0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
                        70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
                    }
                `}
            </style>
        </div>
    );
}