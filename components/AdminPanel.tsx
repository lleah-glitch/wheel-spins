
import React, { useState, useRef } from 'react';
import { Prize, PrizeType, User } from '../types';
import { generatePrizeConfig } from '../services/geminiService';
import { Trash2, Plus, Sparkles, Save, Upload, Users, Settings, FileSpreadsheet } from 'lucide-react';

interface AdminPanelProps {
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  close: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ prizes, setPrizes, users, setUsers, close }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'prizes'>('prizes');
  const [userImportText, setUserImportText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempPrizes, setTempPrizes] = useState<Prize[]>(prizes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportUsers = () => {
    const lines = userImportText.split('\n');
    const newUsers: User[] = [];
    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (cleanLine) {
        newUsers.push({
          id: `u-${Date.now()}-${Math.random()}`,
          name: cleanLine,
          hasPlayed: false
        });
      }
    });
    setUsers([...users, ...newUsers]);
    setUserImportText('');
    alert(`Successfully imported ${newUsers.length} users.`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        // Access global XLSX variable loaded from CDN
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const XLSX = (window as any).XLSX;
        
        if (!XLSX) {
          alert("Excel library not loaded yet. Please refresh and try again.");
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get range of data
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const extractedNames: string[] = [];

        // Iterate through rows (r) but strictly only Column A (c = 0)
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = { c: 0, r: R }; // Column A has index 0
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          const cell = worksheet[cellRef];

          if (cell && cell.v) {
            const val = String(cell.v).trim();
            if (val && val.toLowerCase() !== 'name' && val.toLowerCase() !== 'username') {
               // Simple check to potentially avoid header rows if user desires, 
               // but generally we just take everything as requested.
               extractedNames.push(val);
            }
          }
        }

        if (extractedNames.length > 0) {
          const newUsers: User[] = extractedNames.map(name => ({
            id: `u-xls-${Date.now()}-${Math.random()}`,
            name: name,
            hasPlayed: false
          }));
          setUsers([...users, ...newUsers]);
          alert(`Successfully imported ${newUsers.length} users from Excel.`);
        } else {
          alert("No data found in Column A of the first sheet.");
        }

      } catch (error) {
        console.error("Excel parsing error:", error);
        alert("Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.");
      } finally {
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
           fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleGeneratePrizes = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const generated = await generatePrizeConfig(prompt);
      setTempPrizes(generated);
    } catch (e) {
      alert("Failed to generate prizes. Please check API Key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    const updated = [...tempPrizes];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setTempPrizes(updated);
  };

  const totalProbability = tempPrizes.reduce((sum, p) => sum + p.probability, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gaming-800 w-full max-w-4xl h-[85vh] rounded-2xl border border-gaming-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gaming-700 flex justify-between items-center bg-gaming-900">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-gaming-accent" /> 
            Admin Configuration
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gaming-700">
          <button 
            onClick={() => setActiveTab('prizes')}
            className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'prizes' ? 'bg-gaming-700 text-white border-b-2 border-gaming-accent' : 'text-gray-400 hover:bg-gaming-700/50'}`}
          >
            <GiftIcon /> Prize Config
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-gaming-700 text-white border-b-2 border-gaming-accent' : 'text-gray-400 hover:bg-gaming-700/50'}`}
          >
            <Users size={18} /> User Management
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-gaming-900 p-4 rounded-lg border border-gaming-700">
                <h3 className="text-lg font-semibold mb-2">Import Users</h3>
                <p className="text-sm text-gray-400 mb-2">Batch import users via text or Excel file.</p>
                
                {/* Manual Text Input */}
                <textarea 
                  value={userImportText}
                  onChange={(e) => setUserImportText(e.target.value)}
                  className="w-full h-32 bg-gaming-800 border border-gaming-700 rounded p-3 text-white focus:ring-2 focus:ring-gaming-accent outline-none mb-3"
                  placeholder="Paste names here (one per line)..."
                />
                
                <div className="flex gap-3">
                  {/* Text Import Button */}
                  <button 
                    onClick={handleImportUsers}
                    className="bg-gaming-accent hover:bg-violet-600 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                  >
                    <Upload size={18} /> Import Text
                  </button>

                  {/* Excel Import Button */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    accept=".xlsx, .xls" 
                    onChange={handleExcelUpload} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet size={18} /> Import Excel (Col A)
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Registered Users ({users.length})</h3>
                <div className="bg-gaming-900 rounded-lg border border-gaming-700 overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gaming-800 text-gray-400 text-sm">
                      <tr>
                        <th className="p-3">Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-gaming-800 last:border-0">
                          <td className="p-3">{u.name}</td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded ${u.hasPlayed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                              {u.hasPlayed ? 'Played' : 'Eligible'}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-300">
                            {u.wonPrize || '-'}
                          </td>
                          <td className="p-3">
                             <button onClick={() => setUsers(users.filter(x => x.id !== u.id))} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-6">
              {/* AI Generator */}
              <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-5 rounded-xl border border-indigo-500/30">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-indigo-200">
                  <Sparkles size={18} className="text-yellow-300" /> 
                  AI Prize Configurator
                </h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'New Year event with 1 motorbike, 5000 users, lots of gold coins'"
                    className="flex-1 bg-black/20 border border-indigo-500/30 rounded px-3 py-2 text-white placeholder-indigo-300/50 focus:outline-none focus:bg-black/40"
                  />
                  <button 
                    onClick={handleGeneratePrizes}
                    disabled={isGenerating}
                    className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-all"
                  >
                    {isGenerating ? 'Thinking...' : 'Auto-Generate'}
                  </button>
                </div>
              </div>

              {/* Manual Config */}
              <div className="bg-gaming-900 p-4 rounded-lg border border-gaming-700">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-semibold">Prize List</h3>
                   <span className={`text-sm font-mono ${Math.abs(totalProbability - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                     Total Prob: {totalProbability.toFixed(2)}%
                   </span>
                </div>
                
                <div className="space-y-3">
                  {tempPrizes.map((prize, idx) => (
                    <div key={prize.id} className="flex gap-2 items-center bg-gaming-800 p-2 rounded border border-gaming-700">
                      <input 
                        value={prize.name} 
                        onChange={(e) => updatePrize(idx, 'name', e.target.value)}
                        className="bg-transparent border-b border-gray-600 text-white px-2 py-1 w-1/3 focus:border-gaming-accent outline-none"
                      />
                      <select 
                        value={prize.type}
                        onChange={(e) => updatePrize(idx, 'type', e.target.value)}
                        className="bg-gaming-900 text-xs text-gray-300 rounded px-2 py-1 border border-gaming-700"
                      >
                        <option value={PrizeType.PHYSICAL}>Physical</option>
                        <option value={PrizeType.CURRENCY}>Currency</option>
                        <option value={PrizeType.EMPTY}>Empty</option>
                      </select>
                      <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                        <span className="text-xs text-gray-400">%</span>
                        <input 
                           type="number" 
                           step="0.1"
                           value={prize.probability}
                           onChange={(e) => updatePrize(idx, 'probability', parseFloat(e.target.value))}
                           className="w-16 bg-transparent text-right text-yellow-400 font-mono outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const newP = [...tempPrizes];
                          newP.splice(idx, 1);
                          setTempPrizes(newP);
                        }}
                        className="p-2 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setTempPrizes([...tempPrizes, { id: Date.now().toString(), name: 'New Prize', type: PrizeType.PHYSICAL, probability: 0, color: '#64748b', icon: 'Gift' }])}
                  className="mt-4 w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded flex items-center justify-center gap-2"
                >
                  <Plus size={16}/> Add Prize Item
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gaming-700 bg-gaming-900 flex justify-end gap-3">
          <button onClick={close} className="px-6 py-2 rounded text-gray-300 hover:bg-gaming-800">Cancel</button>
          <button 
            onClick={() => {
              setPrizes(tempPrizes);
              close();
            }}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-lg shadow-green-900/20 flex items-center gap-2 font-bold"
          >
            <Save size={18} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

const GiftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>
);

export default AdminPanel;
