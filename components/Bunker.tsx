import React, { useState } from 'react';
import { Hero, Mission, MissionStatus, PersonalObjective } from '../types';
import { Users, BookOpen, Shield, Target, Plus, Trash2, CheckSquare, Square, Save, MapPin } from 'lucide-react';

interface BunkerProps {
  heroes: Hero[];
  missions: Mission[];
  onUpdateHero: (hero: Hero) => void;
  onAddHero: () => void;
  onDeleteHero: (id: string) => void;
  onClose: () => void;
}

const Bunker: React.FC<BunkerProps> = ({ 
  heroes, 
  missions, 
  onUpdateHero, 
  onAddHero, 
  onDeleteHero,
  onClose 
}) => {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(heroes.length > 0 ? heroes[0].id : null);
  const [newObjectiveText, setNewObjectiveText] = useState('');

  const selectedHero = heroes.find(h => h.id === selectedHeroId);

  // Available missions for assignment (only AVAILABLE status)
  const availableMissions = missions.filter(m => m.status === MissionStatus.AVAILABLE);

  const handleUpdateBio = (text: string) => {
    if (selectedHero) {
      onUpdateHero({ ...selectedHero, bio: text });
    }
  };

  const handleUpdateName = (text: string) => {
    if (selectedHero) {
      onUpdateHero({ ...selectedHero, name: text });
    }
  };

  const handleAssignMission = (missionId: string) => {
    if (selectedHero) {
      onUpdateHero({ ...selectedHero, assignedMissionId: missionId === "" ? null : missionId });
    }
  };

  const handleAddPersonalObjective = () => {
    if (selectedHero && newObjectiveText.trim()) {
      const newObj: PersonalObjective = {
        id: Date.now().toString(),
        text: newObjectiveText,
        completed: false
      };
      onUpdateHero({
        ...selectedHero,
        personalObjectives: [...selectedHero.personalObjectives, newObj]
      });
      setNewObjectiveText('');
    }
  };

  const handleTogglePersonalObjective = (objId: string) => {
    if (selectedHero) {
      const updated = selectedHero.personalObjectives.map(o => 
        o.id === objId ? { ...o, completed: !o.completed } : o
      );
      onUpdateHero({ ...selectedHero, personalObjectives: updated });
    }
  };

  const handleDeletePersonalObjective = (objId: string) => {
      if (selectedHero) {
          const updated = selectedHero.personalObjectives.filter(o => o.id !== objId);
          onUpdateHero({ ...selectedHero, personalObjectives: updated });
      }
  };

  // Get details of assigned mission for display
  const assignedMissionDetails = selectedHero?.assignedMissionId 
    ? missions.find(m => m.id === selectedHero.assignedMissionId) 
    : null;

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-500" size={24} />
          <div>
            <h1 className="text-xl font-mono font-bold text-white tracking-widest uppercase">BÚNKER: EL NIDO</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide">GESTIÓN DE ACTIVOS Y HÉROES</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-bold uppercase transition-colors"
        >
          Volver al Mapa
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Hero Grid */}
        <div className="w-1/3 border-r border-slate-800 p-6 overflow-y-auto bg-dark-bg/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
              <Users size={16}/> Agentes Activos
            </h2>
            <button 
              onClick={onAddHero}
              className="p-2 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-white rounded border border-blue-900 transition-colors"
              title="Reclutar Héroe"
            >
              <Plus size={16}/>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {heroes.map(hero => (
              <div 
                key={hero.id}
                onClick={() => setSelectedHeroId(hero.id)}
                className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedHeroId === hero.id ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-slate-800 hover:border-slate-600'}`}
              >
                {/* Image Aspect Ratio Wrapper */}
                <div className="aspect-square w-full bg-slate-900 relative">
                   <img 
                      src={hero.photoUrl} 
                      alt={hero.name} 
                      className="w-full h-full object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"/>
                   
                   {/* Name Overlay */}
                   <div className="absolute bottom-0 left-0 w-full p-2">
                      <p className={`font-mono font-bold text-sm truncate ${selectedHeroId === hero.id ? 'text-white' : 'text-slate-300'}`}>
                        {hero.name}
                      </p>
                      {hero.assignedMissionId && (
                         <div className="flex items-center gap-1 text-[9px] text-yellow-500">
                            <Target size={8} /> <span>EN MISIÓN</span>
                         </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail View */}
        {selectedHero ? (
          <div className="flex-1 overflow-y-auto p-8 bg-panel-bg flex flex-col gap-8">
            
            {/* Top Section: Profile Header */}
            <div className="flex gap-6 items-start">
               <div className="w-32 h-32 rounded-lg border-2 border-slate-700 overflow-hidden shrink-0 shadow-2xl">
                  <img src={selectedHero.photoUrl} className="w-full h-full object-cover object-center" alt="Profile" />
               </div>
               
               <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Nombre en Clave</label>
                    <input 
                      value={selectedHero.name}
                      onChange={(e) => handleUpdateName(e.target.value)}
                      className="w-full bg-transparent text-3xl font-mono font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                      <BookOpen size={12}/> Archivo Biográfico
                    </label>
                    <textarea 
                      value={selectedHero.bio}
                      onChange={(e) => handleUpdateBio(e.target.value)}
                      className="w-full h-24 bg-slate-900/50 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none"
                      placeholder="Historial del héroe..."
                    />
                  </div>
               </div>
               
               <button 
                  onClick={() => onDeleteHero(selectedHero.id)}
                  className="text-red-900 hover:text-red-500 p-2 transition-colors"
                  title="Eliminar Registro"
               >
                  <Trash2 size={20}/>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              
              {/* Personal Objectives */}
              <div className="space-y-4 bg-slate-900/30 p-4 rounded border border-slate-800">
                 <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                   <Target size={16}/> Misiones Personales
                 </h3>
                 
                 <div className="space-y-2">
                   {selectedHero.personalObjectives.map(obj => (
                     <div key={obj.id} className="flex items-start gap-3 group">
                        <button onClick={() => handleTogglePersonalObjective(obj.id)} className="mt-0.5 text-slate-500 hover:text-blue-500 transition-colors">
                           {obj.completed ? <CheckSquare size={16} className="text-green-500"/> : <Square size={16}/>}
                        </button>
                        <span className={`text-sm flex-1 ${obj.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {obj.text}
                        </span>
                        <button onClick={() => handleDeletePersonalObjective(obj.id)} className="text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={14} />
                        </button>
                     </div>
                   ))}
                   
                   <div className="flex gap-2 mt-4 pt-2 border-t border-slate-800/50">
                     <input 
                        value={newObjectiveText}
                        onChange={(e) => setNewObjectiveText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPersonalObjective()}
                        placeholder="Nueva meta personal..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                     />
                     <button onClick={handleAddPersonalObjective} className="bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-900/50 rounded px-2">
                        <Plus size={16}/>
                     </button>
                   </div>
                 </div>
              </div>

              {/* Map Mission Assignment */}
              <div className="space-y-4 bg-slate-900/30 p-4 rounded border border-slate-800">
                  <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                    <MapPin size={16}/> Asignación Táctica
                  </h3>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Misión Actual</label>
                        <select 
                          value={selectedHero.assignedMissionId || ""}
                          onChange={(e) => handleAssignMission(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded p-2 outline-none focus:border-yellow-500"
                        >
                          <option value="">-- Sin Asignar --</option>
                          {availableMissions.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.title} ({m.locationState || 'Ubicación desconocida'})
                            </option>
                          ))}
                          {/* Keep assigned mission in list even if not available anymore */}
                          {assignedMissionDetails && assignedMissionDetails.status !== MissionStatus.AVAILABLE && (
                             <option value={assignedMissionDetails.id}>
                               {assignedMissionDetails.title} ({assignedMissionDetails.status})
                             </option>
                          )}
                        </select>
                     </div>

                     {assignedMissionDetails ? (
                       <div className="bg-black/40 p-3 rounded border border-yellow-900/30 space-y-2">
                          <h4 className="text-yellow-500 font-bold text-xs">{assignedMissionDetails.title}</h4>
                          <p className="text-slate-400 text-[10px] leading-relaxed">{assignedMissionDetails.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                               assignedMissionDetails.status === MissionStatus.COMPLETED ? 'border-green-800 text-green-500' : 'border-yellow-800 text-yellow-500'
                             }`}>
                               {assignedMissionDetails.status}
                             </span>
                             {assignedMissionDetails.locationState && (
                               <span className="text-[9px] text-slate-500 uppercase">
                                  UBICACIÓN: {assignedMissionDetails.locationState}
                               </span>
                             )}
                          </div>
                       </div>
                     ) : (
                       <div className="text-center py-6 text-slate-600 text-xs italic border border-dashed border-slate-800 rounded">
                          Agente disponible para despliegue.
                       </div>
                     )}
                  </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col gap-4">
            <Users size={48} className="opacity-20"/>
            <p className="font-mono text-sm uppercase tracking-widest">Selecciona un héroe del archivo</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Bunker;