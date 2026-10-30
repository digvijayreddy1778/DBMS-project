import { useState } from 'react';
import AdmissionPredictor from './components/AdmissionPredictor';
import CollegeDiscovery from './components/CollegeDiscovery';
import CounsellingTimeline from './components/CounsellingTimeline';
import ChoiceCart from './components/ChoiceCart'; // NEW COMPONENT
import Auth from './components/Auth';

export default function App() {
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('discover');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  if (!user) {
    return <Auth onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Navigation Bar */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)', position: 'sticky', top: 0, zIndex: 2000, borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#3b82f6', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>
            E
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '0.5px' }}>EduCompass Pro</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Advanced JoSAA Admission Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <nav style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setActiveTab('discover')}
              style={{ padding: '8px 16px', backgroundColor: activeTab === 'discover' ? '#3b82f6' : 'transparent', color: activeTab === 'discover' ? 'white' : '#cbd5e1', border: activeTab === 'discover' ? 'none' : '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              🔍 Discover Colleges
            </button>

            {/* NEW DASHBOARD TAB */}
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ padding: '8px 16px', backgroundColor: activeTab === 'dashboard' ? '#8b5cf6' : 'transparent', color: activeTab === 'dashboard' ? 'white' : '#cbd5e1', border: activeTab === 'dashboard' ? 'none' : '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              📋 My Dashboard
            </button>

            <button 
              onClick={() => setActiveTab('predict')}
              style={{ padding: '8px 16px', backgroundColor: activeTab === 'predict' ? '#10b981' : 'transparent', color: activeTab === 'predict' ? 'white' : '#cbd5e1', border: activeTab === 'predict' ? 'none' : '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              📊 Specific Predictor
            </button>
            
            <button 
              onClick={() => setActiveTab('timeline')}
              style={{ padding: '8px 16px', backgroundColor: activeTab === 'timeline' ? '#f59e0b' : 'transparent', color: activeTab === 'timeline' ? 'white' : '#cbd5e1', border: activeTab === 'timeline' ? 'none' : '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
            >
              ⏱️ Action Timeline
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '1px solid #334155', paddingLeft: '20px' }}>
            
            <div 
              style={{ position: 'relative' }} 
              onMouseEnter={() => setShowProfileMenu(true)} 
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <div style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid transparent', borderRadius: '6px', transition: 'border 0.2s', borderColor: showProfileMenu ? '#3b82f6' : 'transparent' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Hello, {user.email.split('@')[0]}</span>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Account & Stats ▼</strong>
              </div>

              {showProfileMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '5px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '20px', minWidth: '260px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 3000, cursor: 'default' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: 'white', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>Your Active Session</h4>
                  
                  <div id="navbar-portal-target" style={{ marginBottom: '16px' }}>
                    {activeTab !== 'discover' && (
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Navigate to 'Discover Colleges' to view active search stats.</p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0', wordBreak: 'break-all' }}>Logged in as:<br/>{user.email}</p>
                    <button 
                      onClick={() => setUser(null)}
                      style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.target.style.backgroundColor = '#ef4444'; e.target.style.color = 'white'; }}
                      onMouseOut={(e) => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#ef4444'; }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main>
        {activeTab === 'discover' && <CollegeDiscovery user={user} />}
        {activeTab === 'dashboard' && <ChoiceCart user={user} />} {/* NEW ROUTE */}
        {activeTab === 'predict' && <AdmissionPredictor user={user} />}
        {activeTab === 'timeline' && <CounsellingTimeline />}
      </main>

    </div>
  );
}