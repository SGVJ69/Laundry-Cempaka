
import React from 'react';
import { Machine, MachineStatus } from '../types';

interface MachineCardProps {
  machine: Machine;
  customIcon: string;
  isOwnedByMe: boolean;
  onBook: (machine: Machine) => void;
  onIconUpload: (machineId: string, base64: string) => void;
  onViewTimer: () => void;
}

const MachineCard: React.FC<MachineCardProps> = ({ 
  machine, 
  customIcon, 
  isOwnedByMe, 
  onBook, 
  onIconUpload,
  onViewTimer 
}) => {
  const isAvailable = machine.status === MachineStatus.AVAILABLE;
  const isBusyByOther = machine.status === MachineStatus.BUSY && !isOwnedByMe;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onIconUpload(machine.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`rounded-[35px] p-6 shadow-xl border transition-all duration-300 ${
      isOwnedByMe 
        ? 'bg-blue-50/50 border-blue-200 shadow-blue-100/50 scale-[1.02]' 
        : 'bg-white border-slate-50 shadow-slate-200/50'
    } flex items-center space-x-6 relative group`}>
      
      <div className="relative shrink-0">
        <label className="cursor-pointer block">
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isBusyByOther} />
          <div className={`w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden transition-colors ${!isBusyByOther && 'group-hover:border-blue-100'}`}>
            <img src={customIcon} alt={machine.name} className={`w-full h-full object-cover ${isBusyByOther ? 'grayscale opacity-50' : ''}`} />
          </div>
          {!isBusyByOther && (
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
        </label>
      </div>

      <div className="flex-1 space-y-3">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">
            {machine.name}
            {isOwnedByMe && <span className="ml-2 text-[10px] text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">You</span>}
          </h3>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1.5">
            {machine.type} SERVICE
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
            isAvailable ? 'bg-emerald-50' : isOwnedByMe ? 'bg-blue-100' : 'bg-rose-50'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isAvailable ? 'bg-emerald-500 animate-pulse' : isOwnedByMe ? 'bg-blue-500 animate-bounce' : 'bg-rose-500'
            }`}></div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${
              isAvailable ? 'text-emerald-600' : isOwnedByMe ? 'text-blue-600' : 'text-rose-600'
            }`}>
              {isAvailable ? 'Ready' : isOwnedByMe ? 'Your Cycle' : 'Occupied'}
            </span>
          </div>
          {!isAvailable && machine.remainingMinutes !== undefined && (
            <span className="text-[10px] font-bold text-slate-500 tracking-tight">
              ~{machine.remainingMinutes}m left
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isAvailable ? (
          <button
            onClick={() => onBook(machine)}
            className="w-14 h-14 bg-blue-500 text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-all hover:bg-blue-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        ) : isOwnedByMe ? (
          <button
            onClick={onViewTimer}
            className="w-14 h-14 bg-white border-2 border-blue-500 text-blue-500 rounded-[22px] flex items-center justify-center shadow-md active:scale-90 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        ) : (
          <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-[22px] flex items-center justify-center border border-slate-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineCard;
