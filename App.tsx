import React, { useState, useEffect, useCallback } from 'react';
import Wheel from './components/Wheel';
import AdminPanel from './components/AdminPanel';
import { Prize, User, DEFAULT_PRIZES, AppConfig } from './types';
import { Settings, LogIn, Trophy, Coins, Gift, HeadphonesIcon, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  // Initialize with some dummy users for demo purposes if needed, or empty
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Demo User 1', hasPlayed: false },
    { id: '2', name: 'Demo User 2', hasPlayed: false },
  ]);
  
  // App Configuration State
  const [appConfig, setAppConfig] = useState<AppConfig>({
    title: 'LuckSpin Pro',
    logoUrl: null,
    ipWhitelist: [], // Default empty means allow all for setup, until populated
    customerServiceUrl: '',
    wheelDisplayMode: 'IMAGE' // Default to Image mode as per previous requests
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showCSModal, setShowCSModal] = useState(false);
  const [currentIp, setCurrentIp] = useState<string>('');
  
  // Game State
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winPrize, setWinPrize] = useState<Prize | null>(null);

  // Fetch IP on Mount
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setCurrentIp(data.ip);
        console.log("Client IP:", data.ip);
      } catch (err) {
        console.error("Failed to fetch IP", err);
      }
    };
    fetchIp();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.name.toLowerCase() === usernameInput.toLowerCase().trim());
    
    if (foundUser) {
      if (foundUser.hasPlayed) {
        alert("This user has already played!");
      } else {
        setCurrentUser(foundUser);
      }
    } else {
      alert("User not found in the eligible list.");
    }
  };

  const handleSpinClick = useCallback(() => {
    if (!currentUser || currentUser.hasPlayed || mustSpin) return;

    let selectedIndex = 0;

    // Check for Internal User Rigged Outcome
    if (currentUser.isInternal) {
      // Find the prize with the lowest probability (but greater than 0, or allow 0 if desired, typically 0.2 is lower than 50)
      // We sort by probability ASC
      const sortedIndices = prizes
          .map((p, i) => ({ ...p, index: i }))
          .sort((a, b) => a.probability - b.probability);
      
      // Pick the first one (lowest prob)
      selectedIndex = sortedIndices[0].index;
      console.log("Internal User Rigged Win detected. Selecting prize index:", selectedIndex);

    } else {
      // Weighted Random Selection for normal users
      const totalProb = prizes.reduce((sum, item) => sum + item.probability, 0);
      const random = Math.random() * totalProb;
      
      let currentSum = 0;
      for (let i = 0; i < prizes.length; i++) {
        currentSum += prizes[i].probability;
        if (random <= currentSum) {
          selectedIndex = i;
          break;
        }
      }
    }

    setPrizeNumber(selectedIndex);
    setMustSpin(true);
    
    const winningPrize = prizes[selectedIndex];
    const timestamp = new Date().toISOString();

    // Mark user as played immediately to prevent double clicks/exploits AND record the prize and time
    const updatedUsers = users.map(u => 
      u.id === currentUser.id ? { 
        ...u, 
        hasPlayed: true, 
        wonPrize: winningPrize.name,
        playedAt: timestamp
      } : u
    );
    setUsers(updatedUsers);
    setCurrentUser({ 
      ...currentUser, 
      hasPlayed: true, 
      wonPrize: winningPrize.name,
      playedAt: timestamp
    });

  }, [currentUser, users, prizes, mustSpin]);

  const handleStopSpinning = () => {
    setMustSpin(false);
    setWinPrize(prizes[prizeNumber]);
    setShowWinnerModal(true);
  };

  const resetGame = () => {
    setShowWinnerModal(false);
    setWinPrize(null);
    setCurrentUser(null);
    setUsernameInput('');
  };

  const handleSettingsClick = () => {
    // Logic:
    // 1. If whitelist is empty, we assume it's fresh setup or open mode -> Allow Admin
    // 2. If whitelist has IPs, check if currentIp is in it.
    // 3. If match -> Allow Admin.
    // 4. Else -> Show Customer Service Modal.
    
    const isWhitelisted = appConfig.ipWhitelist.length === 0 || appConfig.ipWhitelist.includes(currentIp);

    if (isWhitelisted) {
      setShowAdmin(true);
    } else {
      setShowCSModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gaming-800 via-gaming-900 to-black flex flex-col font-sans text-slate-200">
      
      {/* Navbar */}
      <nav className="w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          {appConfig.logoUrl ? (
            <img 
              src={appConfig.logoUrl} 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-white/10" 
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-gaming-accent to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
               <Gift className="text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            {appConfig.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-medium text-white">{currentUser.name}</span>
            </div>
          )}
          <button 
            onClick={handleSettingsClick}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 md:p-10 gap-12 relative">
        
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Left Side: Info / Login */}
        <div className="w-full md:w-1/3 max-w-md space-y-8 z-10">
          {!currentUser ? (
            <div className="bg-gaming-800/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl transform transition-all hover:scale-[1.01]">
              <h2 className="text-3xl font-bold text-white mb-2">START TO SPIN</h2>
              <p className="text-gray-400 mb-6">Verify your game user ID to spin the wheel of fortune.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Game User ID</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-gaming-accent focus:border-transparent outline-none transition-all"
                      placeholder="Enter your ID..."
                    />
                    <LogIn className="absolute left-3 top-3.5 text-gray-500" size={18} />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-gaming-accent to-indigo-600 hover:from-indigo-500 hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95"
                >
                  Verify & Spin
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-gray-500">Only requirements available users can participate.</p>
              </div>
            </div>
          ) : (
            <div className="bg-gaming-800/50 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl text-center">
              <div className="inline-block p-3 rounded-full bg-green-500/20 text-green-400 mb-4">
                <UserCheckIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome, {currentUser.name}!</h2>
              <p className="text-gray-400 mb-6">You have <span className="text-gaming-accent font-bold">1</span> spin available.</p>
              
              <button 
                onClick={handleSpinClick}
                disabled={mustSpin || currentUser.hasPlayed}
                className={`w-full py-4 rounded-xl font-bold text-xl uppercase tracking-wider shadow-xl transition-all transform 
                  ${mustSpin || currentUser.hasPlayed
                    ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white hover:scale-105 shadow-orange-500/20'
                  }`}
              >
                {mustSpin ? 'Spinning...' : (currentUser.hasPlayed ? 'Played' : 'SPIN NOW')}
              </button>
            </div>
          )}
          
          {/* Stats or Prize Ticker could go here */}
          <div className="hidden md:block p-4 bg-black/20 rounded-xl border border-white/5">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
              <Trophy size={14} className="text-gaming-gold"/> Top Prizes
            </h3>
            <div className="space-y-2">
              {[...prizes]
                .sort((a, b) => a.probability - b.probability)
                .slice(0, 3)
                .map(prize => (
                <div key={prize.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{prize.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: The Wheel */}
        <div className="relative z-0 scale-90 md:scale-100">
          <div className="absolute inset-0 bg-gaming-accent/20 blur-[80px] rounded-full pointer-events-none"></div>
          <Wheel 
            prizes={prizes} 
            mustSpin={mustSpin} 
            prizeNumber={prizeNumber} 
            onStopSpinning={handleStopSpinning}
            displayMode={appConfig.wheelDisplayMode}
          />
        </div>

      </main>

      {/* Admin Modal */}
      {showAdmin && (
        <AdminPanel 
          prizes={prizes} 
          setPrizes={setPrizes} 
          users={users}
          setUsers={setUsers}
          appConfig={appConfig}
          setAppConfig={setAppConfig}
          close={() => setShowAdmin(false)} 
        />
      )}

      {/* Customer Service Modal */}
      {showCSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gaming-800 border border-gaming-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HeadphonesIcon className="text-gaming-accent" /> Support
              </h3>
              <button onClick={() => setShowCSModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              If you have encountered any problems, please contact our customer service:
            </p>

            {appConfig.customerServiceUrl ? (
              <a 
                href={appConfig.customerServiceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center py-3 bg-gaming-accent hover:bg-violet-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Contact Customer Service <ExternalLink size={18} />
              </a>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-200 text-sm text-center">
                Customer service link has not been configured yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Winner Modal */}
      {showWinnerModal && winPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-gaming-800 border border-gaming-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl shadow-purple-500/20 relative overflow-hidden">
            {/* Confetti Effect (CSS Only for simplicity in this env) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-500 rounded-full animate-[ping_1s_infinite]"></div>
              <div className="absolute top-10 right-10 w-3 h-3 bg-red-500 rounded-full animate-[bounce_2s_infinite]"></div>
              <div className="absolute bottom-20 left-10 w-2 h-2 bg-blue-500 rounded-full animate-[pulse_1.5s_infinite]"></div>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gaming-accent to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.6)]">
                 {/* Dynamic Icon based on type */}
                 {winPrize.amount ? <Coins size={48} className="text-yellow-200" /> : <Gift size={48} className="text-white" />}
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">Congratulations!</h2>
            <p className="text-gray-400 mb-6">You have won:</p>
            
            <div className="bg-black/40 rounded-xl p-4 mb-8 border border-white/10">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                {winPrize.name}
              </span>
            </div>

            <button 
              onClick={resetGame}
              className="w-full py-3 bg-white text-gaming-900 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const UserCheckIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
);

export default App;