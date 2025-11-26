import React, { useState, useEffect, useRef } from 'react';
import { Mission, BossZone, MissionStatus, Objective, Coordinates, GameMode } from '../types';
import { BOSS_ZONES, STATE_ZONE_MAPPING } from '../constants';
import { Plus, Link as LinkIcon, Trash2, Check, BrainCircuit, Skull, X, List, Share2, Square, CheckSquare, AlertTriangle, ArrowLeft, ChevronRight, Lock, RotateCcw, MapPin, Shield, Biohazard, Warehouse, Download } from 'lucide-react';
import { generateMissionDetails } from '../services/geminiService';

interface ControlPanelProps {
  missions: Mission[];
  selectedMissionId: string | null;
  onAddMission: (mission: Mission) => void;
  onDeleteMission: (id: string) => void;
  onUpdateStatus: (id: string, status: MissionStatus) => void;
  onAddDependency: (targetId: string, parentId: string) => void;
  onUpdateMission: (mission: Mission) => void;
  onDeselect: () => void;
  onSelectMission: (id: string) => void;
  stateLocations: Record<string, Coordinates>;
  currentMode: GameMode;
  onSetMode: (mode: GameMode) => void;
  onToggleBunker: () => void;
  onExportGame: () => void; // New prop for exporting
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  missions,
  selectedMissionId,
  onAddMission,
  onDeleteMission,
  onUpdateStatus,
  onAddDependency,
  onUpdateMission,
  onDeselect,
  onSelectMission,
  stateLocations,
  currentMode,
  onSetMode,
  onToggleBunker,
  onExportGame
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dependencyMode, setIsDependencyMode] = useState<string | null>(null);
  
  // Local state for immediate feedback and auto-save
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newObjectiveText, setNewObjectiveText] = useState('');
  
  const selectedMission = missions.find(m => m.id === selectedMissionId);
  const prevMissionIdRef = useRef<string | null>(null);

  // Sync local state when the selected mission ID changes
  useEffect(() => {
      if (selectedMission) {
          if (selectedMission.id !== prevMissionIdRef.current) {
              setTitle(selectedMission.title);
              setDescription(selectedMission.description || '');
              prevMissionIdRef.current = selectedMission.id;
          }
      }
  }, [selectedMissionId, selectedMission]);

  const handleAutoSave = () => {
    if (selectedMission) {
        // Only update if there are actual changes
        if (selectedMission.title !== title || selectedMission.description !== description) {
            onUpdateMission({
                ...selectedMission,
                title,
                description
            });
        }
    }
  };

  const handleCreateEmptyMission = (zone: BossZone, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newMission: Mission = {
        id: Date.now().toString(),
        title: "Nueva Misión",
        description: "Añade una descripción aquí...",
        objectives: [],
        zoneId: zone.id,
        position: { x: 400 + (Math.random() * 200), y: 300 + (Math.random() * 100) },
        status: MissionStatus.AVAILABLE,
        dependencies: [],
        gameMode: currentMode // Assign current mode
    };
    onAddMission(newMission);
  };

  const handleAIFill = async () => {
      if (!selectedMission) return;
      const zone = BOSS_ZONES.find(z => z.id === selectedMission.zoneId);
      if (!zone) return;

      setIsGenerating(true);
      try {
          const details = await generateMissionDetails(zone, missions.filter(m => m.zoneId === zone.id).length);
          
          setTitle(details.title);
          setDescription(details.description);

          onUpdateMission({
              ...selectedMission,
              title: details.title,
              description: details.description,
              objectives: details.objectives
          });
      } catch (e) {
          console.error("AI Gen failed", e);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleAddObjective = () => {
      if (newObjectiveText.trim() && selectedMission) {
          const newObj: Objective = { 
              id: Date.now().toString(), 
              text: newObjectiveText, 
              completed: false 
          };
          onUpdateMission({
              ...selectedMission,
              objectives: [...(selectedMission.objectives || []), newObj]
          });
          setNewObjectiveText('');
      }
  };

  const handleToggleObjective = (objId: string) => {
      if (selectedMission) {
          const updated = selectedMission.objectives.map(o => 
              o.id === objId ? { ...o, completed: !o.completed } : o
          );
          onUpdateMission({ ...selectedMission, objectives: updated });
      }
  };

  const handleDeleteObjective = (objId: string) => {
      if (selectedMission) {
          const updated = selectedMission.objectives.filter(o => o.id !== objId);
          onUpdateMission({ ...selectedMission, objectives: updated });
      }
  };

  // Group States by Boss Zone for the dropdown
  const getStatesByZone = () => {
    const grouped: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
    Object.entries(STATE_ZONE_MAPPING).forEach(([state, zoneId]) => {
        if (grouped[zoneId]) grouped[zoneId].push(state);
    });
    Object.values(grouped).forEach(list => list.sort());
    return grouped;
  };
  const groupedStates = getStatesByZone();

  const handleStateChange = (newState: string) => {
      if (!selectedMission) return;
      
      const updates: Partial<Mission> = { locationState: newState };
      
      if (stateLocations[newState]) {
          // Add random Jitter (+/- 20px) to prevent overlapping when multiple missions are in the same state
          const jitterX = (Math.random() * 40) - 20;
          const jitterY = (Math.random() * 40) - 20;
          updates.position = { 
              x: stateLocations[newState].x + jitterX, 
              y: stateLocations[newState].y + jitterY 
          };
      }
      
      if (STATE_ZONE_MAPPING[newState]) {
          updates.zoneId = STATE_ZONE_MAPPING[newState];
      }

      onUpdateMission({ ...selectedMission, ...updates });
  };

  return (
    <div className="w-96 h-full bg-panel-bg border-l border-slate-700 flex flex-col font-mono shadow-xl z-30">
      
      {/* Header with Mode Switcher and Bunker Button */}
      <div className="border-b border-slate-700 bg-slate-900 flex flex-col shrink-0">
        <div className="p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Skull className={currentMode === 'ZOMBIES' ? "text-green-500" : "text-blue-500"} />
            MANDO TÁCTICO
            </h1>
            
            <div className="flex gap-2">
              <button 
                onClick={onExportGame}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-700 transition-colors"
                title="Descargar Datos JSON"
              >
                <Download size={14} />
              </button>
              
              <button 
                onClick={onToggleBunker}
                className="px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-[10px] rounded border border-blue-700 flex items-center gap-1 transition-colors uppercase font-bold"
                title="Ir al Búnker"
              >
                <Warehouse size={12}/> EL NIDO
              </button>
            </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex w-full">
            <button 
                onClick={() => onSetMode('HEROES')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 ${currentMode === 'HEROES' ? 'bg-slate-800 text-blue-400 border-blue-500' : 'bg-slate-950 text-slate-600 border-transparent hover:bg-slate-900'}`}
            >
                <Shield size={14} /> Héroes
            </button>
            <button 
                onClick={() => onSetMode('ZOMBIES')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 ${currentMode === 'ZOMBIES' ? 'bg-green-900/20 text-green-400 border-green-500' : 'bg-slate-950 text-slate-600 border-transparent hover:bg-slate-900'}`}
            >
                <Biohazard size={14} /> Zombies
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
        
        {/* VIEW 1: DASHBOARD / LIST VIEW (When no mission selected) */}
        {!selectedMission && (
             <div className="p-4 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Estado: {currentMode}
                    </h2>
                    <span className="text-[10px] text-slate-600 bg-slate-900 px-2 py-0.5 rounded">{missions.length} Misiones</span>
                </div>
                
                {/* List Zones */}
                {BOSS_ZONES.map(zone => {
                    const zoneMissions = missions.filter(m => m.zoneId === zone.id);
                    
                    return (
                        <div key={zone.id} className="space-y-2">
                            {/* Zone Header */}
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: zone.color}}></div>
                                    <h3 className="text-sm font-bold text-slate-200 uppercase">{zone.bossName}</h3>
                                </div>
                                <button 
                                    onClick={(e) => handleCreateEmptyMission(zone, e)}
                                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] border border-slate-700"
                                    title="Añadir misión a esta zona"
                                >
                                    <Plus size={12}/> AÑADIR
                                </button>
                            </div>

                            {/* Missions List for Zone */}
                            <div className="space-y-1">
                                {zoneMissions.length === 0 ? (
                                    <div className="text-[10px] text-slate-600 italic pl-4 border-l border-slate-800">
                                        Sin actividad en {currentMode === 'HEROES' ? 'este sector' : 'zona infectada'}.
                                    </div>
                                ) : (
                                    zoneMissions.map(mission => (
                                        <button 
                                            key={mission.id}
                                            onClick={() => onSelectMission(mission.id)}
                                            className="w-full text-left pl-3 pr-2 py-2 bg-slate-900/40 hover:bg-slate-800 border-l-2 border-transparent hover:border-yellow-500 transition-all flex justify-between items-center group/item rounded-r"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold truncate ${mission.status === MissionStatus.COMPLETED ? 'text-green-500 line-through opacity-70' : 'text-slate-300'}`}>
                                                        {mission.title}
                                                    </span>
                                                    {mission.locationState && (
                                                        <span className="text-[8px] px-1 bg-slate-800 rounded text-slate-500 uppercase">
                                                            {mission.locationState}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] text-slate-500 truncate">
                                                    {mission.description || "Sin descripción"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {mission.status === MissionStatus.LOCKED && <Lock size={10} className="text-slate-600"/>}
                                                {mission.status === MissionStatus.COMPLETED && <Check size={10} className="text-green-600"/>}
                                                <ChevronRight size={14} className="text-slate-700 group-hover/item:text-yellow-500 transition-colors"/>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* VIEW 2: EDITOR (When selected) */}
        {selectedMission && (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-5 duration-200">
             
             {/* Back Button */}
             <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
                 <button 
                    onClick={onDeselect}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors uppercase font-bold"
                 >
                     <ArrowLeft size={14} /> Volver al listado
                 </button>
             </div>

             {/* Sticky Title Header */}
             <div className="bg-slate-800/80 p-4 border-b border-slate-700 sticky top-0 z-20 backdrop-blur-md">
                 <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between">
                         <span className={`px-2 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wide ${
                            selectedMission.status === MissionStatus.AVAILABLE ? 'border-yellow-600 text-yellow-500 bg-yellow-900/20' :
                            selectedMission.status === MissionStatus.COMPLETED ? 'border-green-600 text-green-500 bg-green-900/20' :
                            'border-red-600 text-red-500 bg-red-900/20'
                        }`}>
                            {selectedMission.status === 'AVAILABLE' ? 'ACTIVA' : 
                            selectedMission.status === 'COMPLETED' ? 'CUMPLIDA' : 'BLOQUEADA'}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">
                             {currentMode}
                        </span>
                     </div>
                     
                     <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-600 focus:border-yellow-500 text-white text-lg font-bold outline-none transition-colors placeholder-slate-500"
                        placeholder="Nombre de la Misión"
                     />
                 </div>
             </div>
             
             <div className="p-4 space-y-6">
                
                {/* Location Selector */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <MapPin size={12} /> Ubicación Estratégica
                    </label>
                    <div className="relative">
                        <select 
                            value={selectedMission.locationState || ''}
                            onChange={(e) => handleStateChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded p-2 outline-none focus:border-yellow-500 appearance-none cursor-pointer"
                        >
                            <option value="">-- Sin Estado Asignado --</option>
                            {BOSS_ZONES.map(zone => (
                                <optgroup key={zone.id} label={zone.bossName} className="text-slate-200 font-bold bg-slate-800">
                                    {groupedStates[zone.id]?.map(state => (
                                        <option key={state} value={state} className="bg-slate-900 text-slate-400 font-normal">
                                            {state}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-3 top-2.5 text-slate-500 pointer-events-none rotate-90"/>
                    </div>
                </div>

                {/* Description / Lore */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Share2 size={12} /> Informe de Misión
                        </h4>
                        <button 
                            onClick={handleAIFill} 
                            disabled={isGenerating}
                            className="text-[10px] text-yellow-500 flex items-center gap-1 hover:text-yellow-400 disabled:opacity-50 transition-colors"
                        >
                            <BrainCircuit size={12}/> {isGenerating ? 'Generando...' : 'Generar IA'}
                        </button>
                    </div>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full h-24 bg-black/30 border border-slate-700 rounded p-3 text-xs text-slate-300 focus:border-yellow-500 outline-none resize-none font-sans leading-relaxed transition-all focus:bg-slate-900"
                        placeholder="Descripción táctica..."
                    />
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <List size={12} /> Objetivos Tácticos
                    </h4>
                    
                    <div className="space-y-1.5">
                        {selectedMission.objectives?.map((obj) => (
                            <div key={obj.id} className="flex items-start gap-2 bg-slate-800/40 p-2 rounded border border-slate-700/50 hover:bg-slate-800 transition-colors group">
                                <button 
                                    onClick={() => handleToggleObjective(obj.id)}
                                    className={`mt-0.5 transition-colors ${obj.completed ? 'text-green-500' : 'text-slate-500 hover:text-yellow-500'}`}
                                >
                                    {obj.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                                </button>
                                
                                <span className={`text-xs flex-1 font-sans ${obj.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {obj.text}
                                </span>
                                
                                <button 
                                    onClick={() => handleDeleteObjective(obj.id)}
                                    className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-2">
                            <input 
                                value={newObjectiveText}
                                onChange={(e) => setNewObjectiveText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddObjective()}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:border-yellow-500 outline-none placeholder-slate-600"
                                placeholder="Añadir nuevo objetivo..."
                            />
                            <button 
                                onClick={handleAddObjective}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded border border-slate-700 hover:text-white transition-colors"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dependencies */}
                <div className="space-y-2">
                     <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800">
                        <div className="flex flex-col">
                            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <LinkIcon size={12}/> Cadena de Mando
                            </h4>
                            <span className="text-[10px] text-slate-600">Requisitos previos</span>
                        </div>
                        <button 
                            onClick={() => setIsDependencyMode(selectedMission.id)}
                            className="text-[10px] bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 border border-blue-900 px-3 py-1.5 rounded font-bold flex items-center gap-1 transition-all"
                        >
                            <LinkIcon size={10}/> CONECTAR
                        </button>
                     </div>
                     
                     <div className="flex flex-col gap-1.5 mt-2">
                         {selectedMission.dependencies.length === 0 ? (
                             <div className="text-[10px] text-slate-600 italic px-2 flex items-center gap-2">
                                <AlertTriangle size={10} /> Sin dependencias asignadas.
                             </div>
                         ) : (
                            selectedMission.dependencies.map(depId => {
                                const dep = missions.find(m => m.id === depId);
                                return (
                                    <div key={depId} className="flex items-center justify-between text-[10px] p-2 bg-black/40 text-slate-300 rounded border border-slate-800 border-l-2 border-l-blue-500">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-500 uppercase mb-0.5">Requiere:</span>
                                            <div className="flex items-center gap-2">
                                                {dep?.status === MissionStatus.COMPLETED ? 
                                                <Check size={10} className="text-green-500"/> : 
                                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                                }
                                                <span className={dep?.status === MissionStatus.COMPLETED ? "line-through opacity-50" : "font-bold"}>
                                                {dep?.title || "Misión Desconocida"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                         )}
                     </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-slate-800 mt-4 space-y-3 pb-8">
                     {selectedMission.status !== MissionStatus.COMPLETED ? (
                        <button 
                            onClick={() => onUpdateStatus(selectedMission.id, MissionStatus.COMPLETED)}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white p-3 rounded shadow-lg shadow-green-900/20 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <Check size={16}/> Completar Misión
                        </button>
                     ) : (
                        <button 
                            onClick={() => onUpdateStatus(selectedMission.id, MissionStatus.AVAILABLE)}
                            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded border border-slate-600 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                            <RotateCcw size={16}/> Reactivar Misión
                        </button>
                     )}
                     
                     <button 
                        onClick={() => onDeleteMission(selectedMission.id)}
                        className="w-full flex items-center justify-center gap-2 bg-red-950/30 text-red-500 border border-red-900/30 p-2 rounded hover:bg-red-900/40 hover:text-red-400 transition-colors text-xs uppercase"
                    >
                        <Trash2 size={14}/> Eliminar Token
                    </button>
                </div>

             </div>
          </div>
        )}
      </div>

      {/* Dependency Selection Overlay */}
      {dependencyMode && (
        <DependencySelector 
            missions={missions} 
            activeId={dependencyMode} 
            onSelect={(parentId) => {
                if (dependencyMode) onAddDependency(dependencyMode, parentId);
                setIsDependencyMode(null);
            }}
            onCancel={() => setIsDependencyMode(null)}
        />
      )}

    </div>
  );
};

// Mini sub-component for selecting parent mission
const DependencySelector: React.FC<{
    missions: Mission[], 
    activeId: string | null, 
    onSelect: (id: string) => void,
    onCancel: () => void
}> = ({ missions, activeId, onSelect, onCancel }) => {
    if (!activeId) return null;
    
    const currentMission = missions.find(m => m.id === activeId);
    const existingDeps = currentMission?.dependencies || [];

    // Filter out self and circular dependencies
    const candidates = missions.filter(m => 
        m.id !== activeId && 
        !existingDeps.includes(m.id)
    ); 

    return (
        <div className="absolute inset-0 bg-slate-950/95 z-50 p-4 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
            <h3 className="text-yellow-500 font-bold mb-1 flex items-center gap-2 text-sm uppercase border-b border-yellow-900/30 pb-2">
                <LinkIcon size={16}/> Modo Conexión
            </h3>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed mt-2">
                Selecciona la misión que debe completarse <strong>ANTES</strong> que <span className="text-white">"{currentMission?.title}"</span>.
            </p>
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {candidates.length === 0 ? (
                    <div className="text-slate-600 text-xs italic text-center mt-10">No hay objetivos disponibles para vincular.</div>
                ) : (
                    candidates.map(m => (
                        <button 
                            key={m.id}
                            onClick={() => onSelect(m.id)}
                            className="w-full text-left p-3 bg-slate-900 border border-slate-800 hover:border-yellow-600/50 hover:bg-slate-800/80 text-xs text-slate-300 rounded transition-all group"
                        >
                            <span className="font-bold block group-hover:text-yellow-400 transition-colors text-sm">{m.title}</span>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-slate-500 uppercase">{BOSS_ZONES.find(z => z.id === m.zoneId)?.bossName}</span>
                                {m.status === MissionStatus.COMPLETED && <span className="text-[9px] text-green-600 font-bold px-1 rounded bg-green-900/10">COMPLETADA</span>}
                            </div>
                        </button>
                    ))
                )}
            </div>
            
            <button onClick={onCancel} className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs rounded uppercase font-bold border border-slate-700 transition-colors">
                Cancelar
            </button>
        </div>
    );
};

export default ControlPanel;