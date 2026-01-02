
import React, { useState, useEffect, useMemo } from 'react';
import { Machine, MachineStatus, MachineType, Page, ActiveBooking } from './types';
import { INITIAL_MACHINES, DEFAULT_LOGO, DEFAULT_WASHER, DEFAULT_DRYER, DEFAULT_GUIDE } from './constants';
import MachineCard from './components/MachineCard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('HOME');
  const [activeType, setActiveType] = useState<MachineType>(MachineType.WASHER);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. UNIQUE IDENTITY: Generate or load a unique User ID for this "phone"
  const myUserId = useMemo(() => {
    const existingId = localStorage.getItem('cempaka_user_id');
    if (existingId) return existingId;
    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('cempaka_user_id', newId);
    return newId;
  }, []);

  // 2. REAL-TIME CHANNEL: Create a broadcast channel for cross-tab communication
  const channel = useMemo(() => new BroadcastChannel('cempaka_sync'), []);
  
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('machines_state');
    return saved ? JSON.parse(saved) : INITIAL_MACHINES;
  });

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  
  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(() => {
    const saved = localStorage.getItem('activeBooking');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      const endTime = parsed.startTime + (parsed.durationMinutes * 60 * 1000);
      if (endTime > now) return parsed;
      localStorage.removeItem('activeBooking');
    }
    return null;
  });
  
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const [machineIcons, setMachineIcons] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('machineIconsMap');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [appLogo, setAppLogo] = useState<string>(() => localStorage.getItem('appLogo') || DEFAULT_LOGO);
  const [washerImg, setWasherImg] = useState<string>(() => localStorage.getItem('washerImg') || DEFAULT_WASHER);
  const [dryerImg, setDryerImg] = useState<string>(() => localStorage.getItem('dryerImg') || DEFAULT_DRYER);
  const [guideImg, setGuideImg] = useState<string>(() => localStorage.getItem('guideImg') || DEFAULT_GUIDE);

  // Sync state to local storage and BROADCAST to other "phones"
  const broadcastState = (updatedMachines: Machine[]) => {
    setMachines(updatedMachines);
    localStorage.setItem('machines_state', JSON.stringify(updatedMachines));
    channel.postMessage({ type: 'SYNC_MACHINES', payload: updatedMachines });
  };

  // Listen for broadcasts from other "phones"
  useEffect(() => {
    channel.onmessage = (event) => {
      if (event.data.type === 'SYNC_MACHINES') {
        setMachines(event.data.payload);
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
      }
    };
    return () => channel.close();
  }, [channel]);

  // Timer logic
  useEffect(() => {
    if (!activeBooking) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = activeBooking.startTime + (activeBooking.durationMinutes * 60 * 1000);
      const diffMs = endTime - now;
      
      if (diffMs <= 0) {
        const updated = machines.map(m => 
          m.id === activeBooking.machineId 
          ? { ...m, status: MachineStatus.AVAILABLE, remainingMinutes: undefined, ownerId: undefined } 
          : m
        );
        broadcastState(updated);
        setActiveBooking(null);
        localStorage.removeItem('activeBooking');
        setCurrentPage('THANK_YOU');
      } else {
        const secondsLeft = Math.floor(diffMs / 1000);
        setTimeLeft(secondsLeft);
        
        // Update local status with time remaining
        setMachines(prev => prev.map(m => 
          m.id === activeBooking.machineId ? { ...m, remainingMinutes: Math.ceil(secondsLeft / 60) } : m
        ));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking, machines.length]);

  const handleCancelBooking = () => {
    if (!activeBooking || !window.confirm("Are you sure you want to cancel this cycle?")) return;

    const updated = machines.map(m => 
      m.id === activeBooking.machineId 
      ? { ...m, status: MachineStatus.AVAILABLE, remainingMinutes: undefined, ownerId: undefined } 
      : m
    );

    broadcastState(updated);
    setActiveBooking(null);
    localStorage.removeItem('activeBooking');
    setCurrentPage('HOME');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, storageKey: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setter(base64);
        localStorage.setItem(storageKey, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMachineIconUpload = (machineId: string, base64: string) => {
    const updatedIcons = { ...machineIcons, [machineId]: base64 };
    setMachineIcons(updatedIcons);
    localStorage.setItem('machineIconsMap', JSON.stringify(updatedIcons));
  };

  const confirmBooking = () => {
    if (!selectedMachine) return;
    
    const updated = machines.map(m => 
      m.id === selectedMachine.id 
      ? { ...m, status: MachineStatus.BUSY, ownerId: myUserId } 
      : m
    );
    
    broadcastState(updated);

    const duration = selectedMachine.type === MachineType.WASHER ? 35 : 45;
    const newBooking = {
      machineId: selectedMachine.id,
      machineName: selectedMachine.name,
      type: selectedMachine.type,
      startTime: Date.now(),
      durationMinutes: duration
    };
    
    setActiveBooking(newBooking);
    localStorage.setItem('activeBooking', JSON.stringify(newBooking));
    setCurrentPage('SUCCESS');
  };

  const NavigationHeader = ({ onBack }: { onBack?: () => void }) => (
    <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-6 z-[200] pointer-events-none">
      <div className="flex items-center space-x-4 pointer-events-auto">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full border border-blue-100 shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all text-blue-500 duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className={`flex items-center space-x-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full border border-slate-100 shadow-sm transition-all duration-500 ${isSyncing ? 'scale-105 border-blue-400' : 'opacity-80'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'}`}></div>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">
            {isSyncing ? 'Incoming Sync' : `ID: ${myUserId.slice(-4)}`}
          </span>
        </div>
      </div>
      <button 
        onClick={() => setCurrentPage('HOME')}
        className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full border border-blue-100 shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all text-blue-500 pointer-events-auto duration-200"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </button>
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#F8FAFF]">
      <NavigationHeader />
      <div className="flex-1 overflow-y-auto px-8 py-24 animate-in fade-in slide-in-from-bottom-6 duration-700 scrollbar-hide">
        <div className="flex flex-col items-center mb-16 space-y-8">
          <label className="cursor-pointer relative group">
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setAppLogo, 'appLogo')} />
            <div className="relative">
              <img src={appLogo} alt="Logo" className="w-28 h-28 object-contain rounded-[40px] shadow-2xl border-4 border-white transition group-hover:scale-105" />
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </label>
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cempaka Laundry</h1>
            <p className="text-[11px] text-blue-400 font-bold uppercase tracking-[0.4em]">Dormitory Elite</p>
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          {[
            { label: 'WASHER', sub: 'HYGIENIC CLEAN', type: MachineType.WASHER, img: washerImg, setter: setWasherImg, key: 'washerImg' },
            { label: 'DRYER', sub: 'RAPID DRY', type: MachineType.DRYER, img: dryerImg, setter: setDryerImg, key: 'dryerImg' },
            { label: 'GUIDE', sub: 'STEP BY STEP', page: 'USER_GUIDE' as Page, img: guideImg, setter: setGuideImg, key: 'guideImg' }
          ].map((item, idx) => (
            <div key={idx} className="relative group">
              <div className="bg-white rounded-[38px] p-7 shadow-xl shadow-blue-900/5 border border-white/80 flex items-center justify-between min-h-[150px] transition-all duration-300 group-hover:bg-blue-50/20 group-hover:border-blue-100">
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-blue-500 uppercase">{item.label}</h2>
                    <p className="text-[9px] font-bold text-blue-300 tracking-[0.2em] uppercase mt-0.5">{item.sub}</p>
                  </div>
                  <button 
                    onClick={() => { if (item.type) { setActiveType(item.type); setCurrentPage('AVAILABILITY'); } else if (item.page) setCurrentPage(item.page); }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black tracking-[0.15em] shadow-lg shadow-blue-200/50 uppercase active:scale-95 transition-all"
                  >
                    SELECT {item.label}
                  </button>
                </div>
                <label className="cursor-pointer relative z-10 w-24 h-24 ml-4 shrink-0">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, item.setter, item.key)} />
                  <img src={item.img} className="w-full h-full object-cover rounded-[28px] shadow-sm border-2 border-white transition group-hover:scale-105" alt={item.label} />
                </label>
              </div>
            </div>
          ))}
        </div>

        {activeBooking && (
          <button 
            onClick={() => setCurrentPage('TIMER_VIEW')}
            className="mt-10 w-full p-7 bg-blue-500 text-white rounded-[35px] shadow-2xl shadow-blue-200 flex justify-between items-center transition-all active:scale-95 animate-pulse"
          >
            <div className="space-y-0.5 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-200">IN PROGRESS</p>
              <p className="text-lg font-black tracking-tight">{activeBooking.machineName}</p>
            </div>
            <div className="bg-white/20 px-5 py-2.5 rounded-xl text-lg font-black backdrop-blur-xl border border-white/20">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </button>
        )}

        <footer className="mt-20 text-center pb-8 opacity-20">
          <p className="text-blue-500 font-black text-[8px] uppercase tracking-[0.6em]">CEMPAKA NETWORK v3.1 REALTIME</p>
        </footer>
      </div>
    </div>
  );

  const renderTimerView = () => {
    const totalSeconds = (activeBooking?.durationMinutes || 1) * 60;
    const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
    const strokeDasharray = 2 * Math.PI * 90;
    const strokeDashoffset = strokeDasharray - (strokeDasharray * progressPercent) / 100;

    return (
      <div className="flex flex-col h-full bg-[#FBFDFF] relative overflow-hidden">
        <NavigationHeader onBack={() => setCurrentPage('HOME')} />
        <div className="flex-1 overflow-y-auto px-8 pt-24 pb-20 flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-700">
          <div className="text-center flex flex-col items-center justify-center scale-110">
            <div className="relative w-64 h-64 flex items-center justify-center">
               <div className="absolute inset-0 bg-blue-100/20 blur-[100px] rounded-full scale-150 animate-pulse"></div>
               <svg className="absolute w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 200 200">
                 <circle cx="100" cy="100" r="90" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="12" fill="none" />
                 <circle cx="100" cy="100" r="90" stroke="#3b82f6" strokeWidth="12" fill="none" strokeLinecap="round"
                    style={{ strokeDasharray, strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }} />
               </svg>
               <div className="relative z-10 flex flex-col items-center justify-center bg-white w-48 h-48 rounded-full shadow-inner border-[10px] border-[#F8FAFF]">
                  <span className="text-5xl font-black tracking-tighter text-slate-800 tabular-nums leading-none">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                  <p className="text-blue-400 font-black tracking-[0.4em] text-[9px] mt-4 uppercase opacity-80">TIME LEFT</p>
               </div>
            </div>
          </div>
          <div className="text-center space-y-6 w-full max-w-[280px]">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.4em]">ACTIVE SESSION</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{activeBooking?.machineName}</h3>
            </div>
            <div className="flex items-center justify-center space-x-3 px-6 py-4 bg-blue-50/50 rounded-3xl border border-blue-100/30">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></div>
              <p className="text-blue-500 font-black tracking-[0.25em] text-[9px] uppercase">Processing Cycle</p>
            </div>
          </div>
          <div className="w-full space-y-4 pt-4">
            <button 
              onClick={() => setCurrentPage('HOME')} 
              className="w-full py-5 bg-white rounded-[28px] border border-blue-100 text-blue-500 font-black text-[11px] tracking-widest uppercase shadow-sm active:scale-95 transition-all"
            >
              MINIMIZE
            </button>
            <button 
              onClick={handleCancelBooking} 
              className="w-full py-5 bg-rose-50 rounded-[28px] border border-rose-100 text-rose-500 font-black text-[11px] tracking-widest uppercase active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>CANCEL CYCLE</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-full bg-white shadow-2xl overflow-hidden relative border-x border-slate-100 flex flex-col scrollbar-hide">
      {currentPage === 'HOME' && renderHome()}
      {currentPage === 'AVAILABILITY' && (
        <div className="flex flex-col h-full bg-[#FBFDFF] relative overflow-hidden">
          <NavigationHeader onBack={() => setCurrentPage('HOME')} />
          <div className="flex-1 overflow-y-auto px-6 pt-24 pb-32 scrollbar-hide animate-in fade-in duration-500">
            <div className="flex flex-col space-y-6 mb-8 mt-2">
              <h1 className="text-3xl font-black text-slate-800 leading-tight">Pick your <br/><span className="text-blue-500">{activeType}</span></h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                  <span className="text-[10px] font-black text-[#10b981] uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Yours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#ef4444] rounded-full"></div>
                  <span className="text-[10px] font-black text-[#ef4444] uppercase tracking-widest">Occupied</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {machines.filter(m => m.type === activeType).map(machine => (
                <MachineCard 
                  key={machine.id} 
                  machine={machine} 
                  isOwnedByMe={machine.ownerId === myUserId}
                  customIcon={machineIcons[machine.id] || (machine.type === MachineType.WASHER ? washerImg : dryerImg)}
                  onIconUpload={handleMachineIconUpload}
                  onViewTimer={() => setCurrentPage('TIMER_VIEW')}
                  onBook={(m) => { setSelectedMachine(m); setCurrentPage('CONFIRM_BOOKING'); }} 
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {currentPage === 'CONFIRM_BOOKING' && (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
          <NavigationHeader onBack={() => setCurrentPage('AVAILABILITY')} />
          <div className="flex-1 overflow-y-auto px-8 pt-24 pb-20 flex flex-col justify-center animate-in zoom-in-95 duration-500">
            <div className="bg-blue-50/30 rounded-[45px] p-10 border border-blue-50/50 space-y-8 text-center">
                <div className="mx-auto w-28 h-28 rounded-[32px] flex items-center justify-center shadow-lg overflow-hidden border-4 border-white bg-white">
                  <img src={machineIcons[selectedMachine?.id || ''] || (selectedMachine?.type === MachineType.WASHER ? washerImg : dryerImg)} className="w-full h-full object-cover" alt="selected" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-800">Confirm Cycle</h2>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Cempaka Premium Service</p>
                </div>
              <div className="space-y-5 px-2">
                {[{ label: 'DEVICE', val: selectedMachine?.name }, { label: 'EST. TIME', val: selectedMachine?.type === MachineType.WASHER ? '35 MIN' : '45 MIN', color: 'text-blue-500' }].map((row, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-blue-100/50 pb-3.5">
                    <span className="text-blue-300 font-black uppercase text-[8px] tracking-widest">{row.label}</span>
                    <span className={`text-base font-black text-slate-700 ${row.color || ''}`}>{row.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={confirmBooking} className="w-full py-6 bg-blue-500 text-white rounded-[28px] font-black text-base tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-200/50">START NOW</button>
            </div>
          </div>
        </div>
      )}
      {currentPage === 'SUCCESS' && (
        <div className="flex flex-col h-full bg-white relative overflow-hidden items-center justify-center p-10 text-center">
          <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mb-10 shadow-inner border-4 border-white">
            <svg className="w-14 h-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">Cycle Locked!</h2>
          <p className="text-blue-400 font-black text-[10px] mb-12 uppercase tracking-[0.25em] leading-relaxed">Everything is set.<br/>We'll keep track of the time.</p>
          <button onClick={() => setCurrentPage('TIMER_VIEW')} className="w-full py-6 bg-blue-500 text-white rounded-[28px] font-black tracking-widest text-sm active:scale-95 transition-all">TRACK LIVE</button>
        </div>
      )}
      {currentPage === 'TIMER_VIEW' && renderTimerView()}
      {currentPage === 'THANK_YOU' && (
        <div className="flex flex-col h-full bg-blue-500 items-center justify-center p-12 text-center text-white animate-in fade-in duration-700">
          <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-md">
            <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-4xl font-black mb-5 tracking-tight">Cycle Finished!</h2>
          <div className="space-y-2 mb-14">
            <p className="text-blue-100 font-black text-[10px] uppercase tracking-[0.4em] leading-loose">Your laundry is fresh & ready.<br/>Collect within 15 mins.</p>
            <p className="text-white font-black text-lg tracking-tight">Thank you for using Cempaka!</p>
          </div>
          <button onClick={() => setCurrentPage('HOME')} className="w-full py-6 bg-white text-blue-500 rounded-[30px] font-black text-base tracking-widest active:scale-95 transition-all shadow-xl">DASHBOARD</button>
        </div>
      )}
      {currentPage === 'USER_GUIDE' && (
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
          <NavigationHeader onBack={() => setCurrentPage('HOME')} />
          <div className="flex-1 overflow-y-auto px-6 pt-24 pb-24 scrollbar-hide animate-in slide-in-from-right duration-700">
            <div className="flex flex-col items-center mb-10 text-center">
              <img src={appLogo} className="w-16 h-16 object-contain mb-4 rounded-3xl" alt="logo" />
              <h1 className="text-3xl font-black text-slate-800 leading-tight">Step-by-Step<br/>Manual</h1>
            </div>
            <div className="space-y-16">
              {[
                {
                  title: 'Tokens & Payment',
                  steps: [
                    { header: '', text: 'Insert cash in the money acceptor slot to get laundry tokens.' },
                    { header: '', text: 'Collect your token from the collection bin below.' }
                  ]
                },
                {
                  title: 'Washer Operations',
                  steps: [
                    { header: '1. Load Clothes', text: 'Place clothes into the washer. Do not overload to ensure proper cleaning.' },
                    { header: '2. Add Supplies', text: 'Open the top drawer.\n• Left: Detergent\n• Right: Softener' },
                    { header: '3. Insert Tokens', text: 'Check the Blue slot for Washer.\nInsert 5 tokens (RM5 total).' },
                    { header: '4. Select Cycle', text: 'Press the cycle button (white) to choose water temp/level.' },
                    { header: '5. Start', text: 'Press the green button to begin.' }
                  ]
                },
                {
                  title: 'Dryer Operations',
                  steps: [
                    { header: '1. Load Clothes', text: 'Place damp clothes into the dryer. Shake them out for even drying.' },
                    { header: '2. Insert Tokens', text: 'Check the Red slot for Dryer.\nInsert 5 tokens (RM5 total).' },
                    { header: '3. Select Heat', text: '• High: Durable items\n• Medium: Synthetics\n• Low: Delicates' },
                    { header: '4. Start', text: 'Press the green button to begin the cycle.' }
                  ]
                }
              ].map((sec, sIdx) => (
                <section key={sIdx} className="space-y-8">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-black text-blue-500 tracking-tight shrink-0 uppercase">{sec.title}</h3>
                    <div className="h-px flex-1 bg-blue-100 rounded-full"></div>
                  </div>
                  <div className="space-y-8">
                    {sec.steps.map((step, i) => (
                      <div key={i} className="flex items-start space-x-5">
                         <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-blue-100">{i + 1}</div>
                         <div className="pt-1 flex-1">
                            {step.header && <p className="text-sm font-black text-slate-800 mb-1">{step.header}</p>}
                            <p className="text-sm font-bold text-slate-600 leading-relaxed tracking-tight whitespace-pre-line">{step.text}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <footer className="mt-20 pt-10 border-t border-slate-50 text-center text-blue-300 font-black text-[9px] uppercase tracking-[0.4em]">Cempaka Premium Quality Guaranteed</footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
