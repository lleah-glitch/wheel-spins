import React, { useState, useRef, useEffect } from 'react';
import { Prize, PrizeType, User, AppConfig } from '../types';
import { generatePrizeConfig } from '../services/geminiService';
import { Trash2, Plus, Sparkles, Save, Upload, Users, Settings, FileSpreadsheet, LayoutTemplate, Shield, Globe, X, Image as ImageIcon, Edit3, Grid } from 'lucide-react';

interface AdminPanelProps {
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  appConfig: AppConfig;
  setAppConfig: (config: AppConfig) => void;
  close: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ prizes, setPrizes, users, setUsers, appConfig, setAppConfig, close }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'prizes' | 'settings'>('prizes');
  const [userImportText, setUserImportText] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [tempPrizes, setTempPrizes] = useState<Prize[]>(prizes);
  const [tempConfig, setTempConfig] = useState<AppConfig>(appConfig);
  const [newIp, setNewIp] = useState('');
  
  // Track which prize index is currently uploading an image
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const prizeImageInputRef = useRef<HTMLInputElement>(null);

  // Sync tempPrizes with props when tab opens/props change
  useEffect(() => {
    setTempPrizes(prizes);
  }, [prizes]);

  // Sync tempConfig with props
  useEffect(() => {
    setTempConfig(appConfig);
  }, [appConfig]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const XLSX = (window as any).XLSX;
        
        if (!XLSX) {
          alert("Excel library not loaded yet.");
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const extractedNames: string[] = [];

        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = { c: 0, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          const cell = worksheet[cellRef];

          if (cell && cell.v) {
            const val = String(cell.v).trim();
            if (val && val.toLowerCase() !== 'name' && val.toLowerCase() !== 'username') {
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
          alert("No data found in Column A.");
        }

      } catch (error) {
        console.error("Excel error:", error);
        alert("Failed to parse Excel file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setTempConfig({ ...tempConfig, logoUrl: evt.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handlePrizeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingIndex === null) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      const updated = [...tempPrizes];
      updated[uploadingIndex] = { ...updated[uploadingIndex], imageUrl: result };
      setTempPrizes(updated);
      setUploadingIndex(null);
    };
    reader.readAsDataURL(file);
  };

  const updatePrize = (index: number, field: keyof Prize, value: string | number) => {
    const updated = [...tempPrizes];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setTempPrizes(updated);
  };

  const handleSectorCountChange = (count: number) => {
    const currentCount = tempPrizes.length;
    if (count === currentCount) return;

    if (count > currentCount) {
      // Add items
      const itemsToAdd = count - currentCount;
      const newItems: Prize[] = Array.from({ length: itemsToAdd }).map((_, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: `Prize ${currentCount + i + 1}`,
        type: PrizeType.EMPTY,
        probability: 0,
        color: i % 2 === 0 ? '#fcd34d' : '#0ea5e9', // Alternate default colors
        icon: 'Gift'
      }));
      setTempPrizes([...tempPrizes, ...newItems]);
    } else {
      // Remove items from end
      setTempPrizes(tempPrizes.slice(0, count));
    }
  };

  const handleAddIp = () => {
    if (!newIp.trim()) return;
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(newIp.trim())) {
      alert("Invalid IP format.");
      return;
    }
    const currentList = tempConfig.ipWhitelist || [];
    if (currentList.includes(newIp.trim())) {
      alert("IP exists.");
      return;
    }
    setTempConfig({ ...tempConfig, ipWhitelist: [...currentList, newIp.trim()] });
    setNewIp('');
  };

  const handleRemoveIp = (ipToRemove: string) => {
    setTempConfig({
      ...tempConfig,
      ipWhitelist: (tempConfig.ipWhitelist || []).filter(ip => ip !== ipToRemove)
    });
  };

  const totalProbability = tempPrizes.reduce((sum, p) => sum + p.probability, 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gaming-800 w-full max-w-4xl h-[90vh] rounded-2xl border border-gaming-700 shadow-2xl flex flex-col overflow-hidden">
        
        <input type="file" ref={prizeImageInputRef} hidden accept="image/*" onChange={handlePrizeImageUpload} />

        {/* Header */}
        <div className="p-6 border-b border-gaming-700 flex justify-between items-center bg-gaming-900">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-gaming-accent" /> Admin Configuration
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gaming-700">
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-gaming-700 text-white border-b-2 border-gaming-accent' : 'text-gray-400 hover:bg-gaming-700/50'}`}>
            <LayoutTemplate size={18} /> General Settings
          </button>
          <button onClick={() => setActiveTab('prizes')} className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'prizes' ? 'bg-gaming-700 text-white border-b-2 border-gaming-accent' : 'text-gray-400 hover:bg-gaming-700/50'}`}>
            <Edit3 size={18} /> Edit the Wheel
          </button>
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-gaming-700 text-white border-b-2 border-gaming-accent' : 'text-gray-400 hover:bg-gaming-700/50'}`}>
            <Users size={18} /> User Management
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gaming-900 p-6 rounded-lg border border-gaming-700">
                 <h3 className="text-lg font-semibold mb-4 text-white">Application Appearance</h3>
                 <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-400 mb-2">Event Title</label>
                   <input type="text" value={tempConfig.title} onChange={(e) => setTempConfig({...tempConfig, title: e.target.value})} className="w-full bg-gaming-800 border border-gaming-700 rounded p-3 text-white focus:ring-2 focus:ring-gaming-accent outline-none" />
                 </div>
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-400 mb-2">Event Logo</label>
                   <div className="flex items-center gap-4">
                      <input type="file" ref={logoInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                      <button onClick={() => logoInputRef.current?.click()} className="bg-gaming-700 hover:bg-gaming-600 text-white px-4 py-2 rounded flex items-center gap-2 border border-gaming-600">
                         <Upload size={16} /> Upload
                      </button>
                      {tempConfig.logoUrl && <button onClick={() => setTempConfig({...tempConfig, logoUrl: null})} className="text-red-400">Reset</button>}
                      {tempConfig.logoUrl && <img src={tempConfig.logoUrl} alt="Preview" className="w-12 h-12 rounded object-contain border border-gaming-600" />}
                   </div>
                 </div>
              </div>

              <div className="bg-gaming-900 p-6 rounded-lg border border-gaming-700">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2"><Shield size={20}/> Security & Support</h3>
                <div className="mb-6">
                   <label className="block text-sm font-medium text-gray-400 mb-2">Customer Service URL</label>
                   <input type="text" value={tempConfig.customerServiceUrl || ''} onChange={(e) => setTempConfig({...tempConfig, customerServiceUrl: e.target.value})} className="w-full bg-gaming-800 border border-gaming-700 rounded p-3 text-white" />
                 </div>
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-400 mb-2">Admin IP Whitelist</label>
                   <div className="flex gap-2 mb-3">
                     <input type="text" value={newIp} onChange={(e) => setNewIp(e.target.value)} className="flex-1 bg-gaming-800 border border-gaming-700 rounded p-2 text-white" placeholder="Enter IP (e.g., 103.61.38.110)" />
                     <button onClick={handleAddIp} className="bg-gaming-700 hover:bg-gaming-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={16} /> Add</button>
                   </div>
                   <div className="bg-gaming-800 rounded p-3 min-h-[50px] border border-gaming-700 flex flex-wrap gap-2">
                     {(tempConfig.ipWhitelist || []).map((ip, idx) => (
                       <div key={idx} className="bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">{ip} <button onClick={() => handleRemoveIp(ip)} className="hover:text-white"><X size={14}/></button></div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-gaming-900 p-4 rounded-lg border border-gaming-700">
                <h3 className="text-lg font-semibold mb-2">Import Users</h3>
                <textarea value={userImportText} onChange={(e) => setUserImportText(e.target.value)} className="w-full h-32 bg-gaming-800 border border-gaming-700 rounded p-3 text-white outline-none mb-3" placeholder="Paste names here..." />
                <div className="flex gap-3">
                  <button onClick={handleImportUsers} className="bg-gaming-accent text-white px-4 py-2 rounded flex items-center gap-2"><Upload size={18} /> Import Text</button>
                  <input type="file" ref={fileInputRef} hidden accept=".xlsx, .xls" onChange={handleExcelUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"><FileSpreadsheet size={18} /> Import Excel</button>
                </div>
              </div>
              <div className="bg-gaming-900 rounded-lg border border-gaming-700 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-gaming-800 text-gray-400 text-sm"><tr><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Product</th><th className="p-3">Action</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gaming-800 last:border-0">
                        <td className="p-3">{u.name}</td>
                        <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${u.hasPlayed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{u.hasPlayed ? 'Played' : 'Eligible'}</span></td>
                        <td className="p-3 text-sm text-gray-300">{u.wonPrize || '-'}</td>
                        <td className="p-3"><button onClick={() => setUsers(users.filter(x => x.id !== u.id))} className="text-red-400"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-8">
              
              {/* Module 1: Playground */}
              <div className="bg-gaming-900 rounded-xl border border-gaming-700 overflow-hidden">
                <div className="bg-gaming-800/50 p-4 border-b border-gaming-700 flex items-center gap-2">
                   <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
                   <h3 className="text-lg font-bold text-white">Module 1: Playground</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Number of Sectors</label>
                      <select 
                        value={tempPrizes.length}
                        onChange={(e) => handleSectorCountChange(parseInt(e.target.value))}
                        className="w-full bg-gaming-800 border border-gaming-700 rounded p-3 text-white focus:ring-2 focus:ring-gaming-accent outline-none appearance-none"
                      >
                         {Array.from({length: 11}, (_, i) => i + 2).map(num => (
                            <option key={num} value={num}>{num} Sectors</option>
                         ))}
                      </select>
                   </div>
                   
                   <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Sector Type</label>
                      <div className="grid grid-cols-2 gap-3">
                         <button 
                           onClick={() => setTempConfig({...tempConfig, wheelDisplayMode: 'IMAGE'})}
                           className={`p-3 rounded border flex items-center justify-center gap-2 transition-all ${tempConfig.wheelDisplayMode === 'IMAGE' ? 'bg-gaming-accent border-gaming-accent text-white' : 'bg-gaming-800 border-gaming-700 text-gray-400 hover:border-gray-500'}`}
                         >
                            <ImageIcon size={18} /> Image
                         </button>
                         <button 
                           onClick={() => setTempConfig({...tempConfig, wheelDisplayMode: 'TEXT'})}
                           className={`p-3 rounded border flex items-center justify-center gap-2 transition-all ${tempConfig.wheelDisplayMode === 'TEXT' ? 'bg-gaming-accent border-gaming-accent text-white' : 'bg-gaming-800 border-gaming-700 text-gray-400 hover:border-gray-500'}`}
                         >
                            <span className="font-serif font-bold text-lg">T</span> Text
                         </button>
                      </div>
                   </div>
                </div>
              </div>

              {/* Module 2: Sectors */}
              <div className="bg-gaming-900 rounded-xl border border-gaming-700 overflow-hidden">
                <div className="bg-gaming-800/50 p-4 border-b border-gaming-700 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
                     <h3 className="text-lg font-bold text-white">Module 2: Sectors</h3>
                   </div>
                   <span className={`text-sm font-mono px-3 py-1 rounded ${Math.abs(totalProbability - 100) < 0.01 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                     Total Probability: {totalProbability.toFixed(1)}%
                   </span>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tempPrizes.map((prize, idx) => (
                      <div key={prize.id} className="bg-gaming-800 rounded-lg border border-gaming-700 p-4 relative group hover:border-gaming-600 transition-colors">
                        <div className="absolute top-2 right-2 text-xs font-bold text-gray-500">#{idx + 1}</div>
                        
                        {/* Image Upload Area */}
                        <div className="flex flex-col items-center mb-4">
                           <div className="w-20 h-20 rounded-full bg-gaming-900 border-2 border-dashed border-gaming-600 flex items-center justify-center overflow-hidden mb-2 group-hover:border-gaming-500 transition-colors relative">
                              {prize.imageUrl ? (
                                <img src={prize.imageUrl} alt="prize" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="text-gray-600" size={24} />
                              )}
                              <button 
                                onClick={() => { setUploadingIndex(idx); prizeImageInputRef.current?.click(); }}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              >
                                <Upload size={16} />
                              </button>
                           </div>
                           <button 
                             onClick={() => { setUploadingIndex(idx); prizeImageInputRef.current?.click(); }}
                             className="text-xs text-gaming-accent hover:text-white underline"
                           >
                             {prize.imageUrl ? 'Change Image' : 'Upload Image'}
                           </button>
                        </div>

                        {/* Details Inputs */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Reward's Name</label>
                            <input 
                              value={prize.name} 
                              onChange={(e) => updatePrize(idx, 'name', e.target.value)}
                              className="w-full bg-gaming-900 border border-gaming-700 rounded px-2 py-1.5 text-sm text-white focus:border-gaming-accent outline-none"
                              placeholder="Prize Name"
                            />
                          </div>
                          
                          {/* Compact Probability & Type controls to maintain game logic */}
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                               <label className="block text-xs text-gray-500 mb-1">Type</label>
                               <select 
                                  value={prize.type}
                                  onChange={(e) => updatePrize(idx, 'type', e.target.value)}
                                  className="w-full bg-gaming-900 border border-gaming-700 rounded px-1 py-1 text-xs text-gray-300"
                               >
                                  <option value={PrizeType.PHYSICAL}>Physical</option>
                                  <option value={PrizeType.CURRENCY}>Currency</option>
                                  <option value={PrizeType.EMPTY}>Empty</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-xs text-gray-500 mb-1">Prob (%)</label>
                               <input 
                                 type="number" step="0.1" 
                                 value={prize.probability} 
                                 onChange={(e) => updatePrize(idx, 'probability', parseFloat(e.target.value))}
                                 className="w-full bg-gaming-900 border border-gaming-700 rounded px-1 py-1 text-xs text-yellow-500 font-mono text-center"
                               />
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gaming-700 bg-gaming-900 flex justify-end gap-3">
          <button onClick={close} className="px-6 py-2 rounded text-gray-300 hover:bg-gaming-800">Cancel</button>
          <button onClick={() => { setPrizes(tempPrizes); setAppConfig(tempConfig); close(); }} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded shadow-lg font-bold flex items-center gap-2"><Save size={18} /> Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;