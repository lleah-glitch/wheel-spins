
import React, { useState, useEffect, useCallback } from 'react';
import Wheel from './components/Wheel';
import AdminPanel from './components/AdminPanel';
import { Prize, User, DEFAULT_PRIZES } from './types';
import { Settings, LogIn, Trophy, Coins, Gift } from 'lucide-react';

const App: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  // Initialize with some dummy users for demo purposes if needed, or empty
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Demo User 1', hasPlayed: false },
    { id: '2', name: 'Demo User 2', hasPlayed: false },
  ]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Game State
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winPrize, setWinPrize] = useState<Prize | null>(null);

  // Sound effects would go here (optional)

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

    // Weighted Random Selection
    const totalProb = prizes.reduce((sum, item) => sum + item.probability, 0);
    const random = Math.random() * totalProb;
    
    let currentSum = 0;
    let selectedIndex = 0;

    for (let i = 0; i < prizes.length; i++) {
      currentSum += prizes[i].probability;
      if (random <= currentSum) {
        selectedIndex = i;
        break;
      }
    }

    setPrizeNumber(selectedIndex);
    setMustSpin(true);
    
    const winningPrize = prizes[selectedIndex];

    // Mark user as played immediately to prevent double clicks/exploits AND record the prize
    const updatedUsers = users.map(u => 
      u.id === currentUser.id ? { ...u, hasPlayed: true, wonPrize: winningPrize.name } : u
    );
    setUsers(updatedUsers);
    setCurrentUser({ ...currentUser, hasPlayed: true, wonPrize: winningPrize.name });

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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gaming-800 via-gaming-900 to-black flex flex-col font-sans text-slate-200">
      
      {/* Navbar */}
      <nav className="w-full p-4 md:p-6 flex justify-between items-center border-b border-white/10 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-gaming-accent to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
             <Gift className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            LuckSpin Pro
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
            onClick={() => setShowAdmin(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Admin Panel"
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
              <h2 className="text-3xl font-bold text-white mb-2">Enter the Game</h2>
              <p className="text-gray-400 mb-6">Verify your eligibility to spin the wheel of fortune.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
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
                  Verify & Play
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-gray-500">Only whitelisted users can participate.</p>
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
          close={() => setShowAdmin(false)} 
        />
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
