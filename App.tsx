
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import MapBoard from './components/MapBoard';
import ControlPanel from './components/ControlPanel';
import Bunker from './components/Bunker';
import { Mission, Coordinates, MissionStatus, GameMode, Hero } from './types';

const App: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [stateLocations, setStateLocations] = useState<Record<string, Coordinates>>({});
  const [currentMode, setCurrentMode] = useState<GameMode>('HEROES');
  const [viewMode, setViewMode] = useState<'MAP' | 'BUNKER'>('MAP');

  const [heroes, setHeroes] = useState<Hero[]>([
    {
      id: 'spiderman',
      name: 'Spider-Man',
      photoUrl: 'https://c0.klipartz.com/pngpicture/81/302/gratis-png-spider-man-venom-dibujo-comic-boceto-spider-man.png',
      bio: 'Peter Parker. Héroe local de Queens. Experto en movilidad urbana y contención no letal. Afiliación: Vengadores / Defensores.',
      personalObjectives: [
        { id: 'h-1', text: "Localizar a Tía May en la Zona de Kingpin", completed: false },
        { id: 'h-2', text: "Recuperar lanzatelarañas del laboratorio Stark", completed: false }
      ]
    },
    {
      id: 'wolverine',
      name: 'Wolverine',
      photoUrl: 'https://4.bp.blogspot.com/-_bqF03KQ67I/U2VB2KfpqnI/AAAAAAAACqI/1jZAV2qQBB8/s1600/00Wolverine.jpg',
      bio: 'James "Logan" Howlett. Factor de curación regenerativo y esqueleto de adamantium. El mejor en lo que hace, y lo que hace no es agradable.',
      personalObjectives: []
    },
    {
      id: 'black-widow',
      name: 'Viuda Negra',
      photoUrl: 'https://static.wikia.nocookie.net/character-level/images/9/9a/QDNpnla.png/revision/latest/scale-to-width-down/400?cb=20190528001733',
      bio: 'Natasha Romanoff. Espía de nivel Omega. Especialista en infiltración profunda en Latveria y sabotaje de redes criminales.',
      personalObjectives: []
    },
    {
      id: 'scorpion',
      name: 'El Escorpión',
      photoUrl: 'https://pm1.aminoapps.com/6903/45299b23717dd34247915508e1b0af38b24f0a13r1-614-500v2_hq.jpg',
      bio: 'Mac Gargan. Ex-criminal reforzado genéticamente. Traje de combate con cola mecánica de ácido. Reclutado por necesidad.',
      personalObjectives: []
    },
    {
      id: 'reed-richards',
      name: 'Reed Richards',
      photoUrl: 'https://i.pinimg.com/474x/8f/0f/e7/8f0fe76e6bf3c8987d415bdbf35b377b.jpg',
      bio: 'Mr. Fantástico. Intelecto nivel genio. Líder de los 4 Fantásticos. Actualmente investigando la cura del virus zombie.',
      personalObjectives: []
    },
    {
      id: 'sabretooth',
      name: 'Dientes de Sable',
      photoUrl: 'https://www.univision.com/_next/image?url=https%3A%2F%2Fuvn-brightspot.s3.amazonaws.com%2Fassets%2Fvixes%2Fbtg%2Fcomics.batanga.com%2Ffiles%2FHistoria-de-Sabretooth-10.jpg&w=1280&q=75',
      bio: 'Victor Creed. Mutante salvaje, asesino y rastreador. Factor de curación avanzado. Peligroso e impredecible.',
      personalObjectives: []
    }
  ]);

  // Initialize with "El Nido" bunker
  useEffect(() => {
    // Check if we already have missions (to avoid double init in strict mode)
    if (missions.length === 0) {
        const bunkerHero: Mission = {
            id: 'bunker-alpha',
            title: 'BÚNKER: EL NIDO (Héroes)',
            description: 'Base de operaciones de la Resistencia. Frontera Kingpin/Tierra de Nadie.',
            objectives: [
              { id: 'obj-init-1', text: "Establecer perímetro seguro", completed: true },
              { id: 'obj-init-2', text: "Contactar con supervivientes", completed: true }
            ],
            zoneId: 0, 
            position: { x: 500, y: 300 }, // Center fixed coords
            status: MissionStatus.COMPLETED,
            dependencies: [],
            locationState: "Nebraska",
            gameMode: 'HEROES'
        };

        const bunkerZombie: Mission = {
            id: 'patient-zero',
            title: 'ZONA CERO: INFECCIÓN',
            description: 'Primer brote masivo en las ruinas de la ciudad.',
            objectives: [
              { id: 'z-1', text: "Sobrevivir a la horda inicial", completed: true },
            ],
            zoneId: 2, // Hulk territory (The Wasteland)
            position: { x: 670, y: 220 }, // Chicago area fixed coords
            status: MissionStatus.COMPLETED,
            dependencies: [],
            locationState: "Illinois",
            gameMode: 'ZOMBIES'
        };

        const kravenMission: Mission = {
            id: 'kraven-hunt',
            title: 'LA CAZA MAYOR DE KRAVEN',
            description: "No hay órdenes. Solo el rastro de los gritos y la desesperación. Kraven el Cazador ha marcado estas ruinas como su coto de caza. Debéis evacuar a un mínimo de 5 supervivientes por el Metro.",
            objectives: [
              { id: 'k-1', text: "¡Deten la caceria!", completed: false },
              { id: 'k-2', text: "Todos debéis sobrevivir", completed: false }
            ],
            zoneId: 3, // Kingpin
            position: { x: 821, y: 174 }, // Fixed coordinates
            status: MissionStatus.AVAILABLE,
            dependencies: [],
            locationState: "New York",
            gameMode: 'HEROES'
        };

        const meatMission: Mission = {
            id: 'meat-sleeps',
            title: 'DONDE LA CARNE DUERME',
            description: "El Metro quedó atrás. Un técnico murmuraba sobre camiones y un viejo penal en el este. Fisk guarda algo allí que no quiere que nadie vea. Si el rumor es cierto, dentro hallaréis más que respuestas.",
            objectives: [
                { id: 'm-1', text: "Investigar el penal abandonado", completed: false },
                { id: 'm-2', text: "Localizar 'La Cámara'", completed: false }
            ],
            zoneId: 3,
            position: { x: 857, y: 216 }, // Fixed coordinates
            status: MissionStatus.LOCKED,
            dependencies: ['kraven-hunt'],
            locationState: "New York",
            gameMode: 'HEROES'
        };

        const fiskMission: Mission = {
            id: 'fisk-territory',
            title: 'TERRITORIO FISK',
            description: "El héroe rescatado en la prisión no os dio un mapa. Os dio la entrada al territorio real de Kingpin. Su Mansión no está a la vista. La protege un barrio fantasma lleno de vigilancia silenciosa. Si desactiváis su red de vigilancia, podréis acceder al único punto débil que oculta: una tapa de alcantarilla privada que lleva al patio interior de la Mansión.",
            objectives: [
                { id: 'f-1', text: "Romper el Cerco: Desactiva los 3 Nodos de Vigilancia", completed: false },
                { id: 'f-2', text: "Puerta Trasera: Accede a la entrada subterránea", completed: false }
            ],
            zoneId: 3,
            position: { x: 854, y: 222 }, // Same coordinates as vestibulo/kingpin
            status: MissionStatus.LOCKED,
            dependencies: ['meat-sleeps'],
            locationState: "New York",
            gameMode: 'HEROES'
        };

        const vestibuloMission: Mission = {
            id: 'vestibulo-condenados',
            title: 'EL VESTÍBULO DE LOS CONDENADOS',
            description: "Salís desde las alcantarillas privadas de Fisk al patio interior de su Mansión. El silencio es absoluto. El vestíbulo no es una entrada: es un filtro. Y Misterio es su guardián. Solo cuando lo derribéis de forma definitiva obtendréis la tarjeta que activa el ascensor.",
            objectives: [
                { id: 'v-1', text: "Derrotar a Misterio y obtener la Tarjeta de Acceso", completed: false },
                { id: 'v-2', text: "Acceder al ascensor antes de que se active la seguridad", completed: false }
            ],
            zoneId: 3,
            position: { x: 854, y: 222 }, // Same coordinates
            status: MissionStatus.LOCKED,
            dependencies: ['fisk-territory'],
            locationState: "New York",
            gameMode: 'HEROES'
        };

        const kingpinBossMission: Mission = {
            id: 'lord-kingpin',
            title: 'LORD KINGPIN',
            description: "El ascensor privado se detiene en el ático. Las puertas se abren. Wilson Fisk no huye. Os espera sentado tras su escritorio de caoba, limpiando la sangre de sus nudillos. 'Bienvenidos al final del mundo civilizado', dice. Ya no es solo un mafioso; es el Rey del nuevo orden. Derrotadlo y cortad la cabeza de la serpiente.",
            objectives: [
                { id: 'kp-1', text: "Derrotar a Wilson Fisk (Lord Kingpin)", completed: false },
                { id: 'kp-2', text: "Recuperar el control de Nueva York", completed: false }
            ],
            zoneId: 3,
            position: { x: 854, y: 222 }, // Same coordinates
            status: MissionStatus.LOCKED,
            dependencies: ['vestibulo-condenados'],
            locationState: "New York",
            gameMode: 'HEROES'
        };

        setMissions([bunkerHero, bunkerZombie, kravenMission, meatMission, fiskMission, vestibuloMission, kingpinBossMission]);
    }
  }, []);

  // Filter missions based on active active mode AND visibility rules (Fog of War)
  const visibleMissions = useMemo(() => 
    missions.filter(m => 
        // 1. Must match current game mode (Heroes vs Zombies)
        m.gameMode === currentMode && 
        // 2. Must NOT be locked. Only Available or Completed missions are shown on the map.
        // This creates the "Fog of War" effect where future connected tokens are invisible.
        m.status !== MissionStatus.LOCKED
    ), 
  [missions, currentMode]);

  // Handle Mode Switching
  const handleModeChange = (mode: GameMode) => {
      setSelectedMissionId(null); // Deselect when switching maps
      setCurrentMode(mode);
  };

  // Dragging logic
  const handleMissionMove = useCallback((id: string, newPos: Coordinates) => {
    setMissions(prev => prev.map(m => 
      m.id === id ? { ...m, position: newPos } : m
    ));
  }, []);

  // Selection
  const handleMissionSelect = (id: string) => {
    // If clicking the Bunker, switch to Bunker View immediately
    if (id === 'bunker-alpha') {
        setViewMode('BUNKER');
        return;
    }
    setSelectedMissionId(id);
  };

  const handleBackgroundClick = () => {
    setSelectedMissionId(null);
  };

  const handleMapLayout = (locations: Record<string, Coordinates>) => {
    setStateLocations(locations);
  };

  // CRUD Missions
  const handleAddMission = (newMission: Mission) => {
    setMissions(prev => [...prev, newMission]);
    setSelectedMissionId(newMission.id);
  };

  const handleUpdateMission = (updatedMission: Mission) => {
    setMissions(prev => prev.map(m => m.id === updatedMission.id ? updatedMission : m));
  };

  const handleDeleteMission = (id: string) => {
    setMissions(prev => prev
        .filter(m => m.id !== id)
        .map(m => ({
            ...m,
            dependencies: m.dependencies.filter(depId => depId !== id) // remove refs
        }))
    );
    if (selectedMissionId === id) setSelectedMissionId(null);
  };

  // CRUD Heroes
  const handleAddHero = () => {
    const newHero: Hero = {
      id: Date.now().toString(),
      name: "Agente Desconocido",
      photoUrl: "https://via.placeholder.com/400x400/000000/FFFFFF?text=CLASSIFIED",
      bio: "Sin datos.",
      personalObjectives: []
    };
    setHeroes([...heroes, newHero]);
  };

  const handleUpdateHero = (updatedHero: Hero) => {
    setHeroes(heroes.map(h => h.id === updatedHero.id ? updatedHero : h));
  };

  const handleDeleteHero = (id: string) => {
    setHeroes(heroes.filter(h => h.id !== id));
  };

  // Check dependencies whenever a status updates
  const handleUpdateStatus = (id: string, status: MissionStatus) => {
    setMissions(prev => {
        // 1. Update the target mission
        let updatedMissions = prev.map(m => m.id === id ? { ...m, status } : m);
        
        // 2. Resolve Chain Reactions (Unlock children)
        if (status === MissionStatus.COMPLETED) {
            updatedMissions = updatedMissions.map(m => {
                if (m.status === MissionStatus.LOCKED) {
                    const allParentsDone = m.dependencies.every(depId => {
                        const parent = updatedMissions.find(p => p.id === depId);
                        return parent && parent.status === MissionStatus.COMPLETED;
                    });
                    
                    if (allParentsDone) {
                        return { ...m, status: MissionStatus.AVAILABLE };
                    }
                }
                return m;
            });
        }

        // 3. Resolve Regressions (Re-lock children if parent un-completed)
        if (status !== MissionStatus.COMPLETED) {
             updatedMissions = updatedMissions.map(m => {
                const hasUnfinishedParent = m.dependencies.some(depId => {
                     const parent = updatedMissions.find(p => p.id === depId);
                     return parent && parent.status !== MissionStatus.COMPLETED;
                });

                if (hasUnfinishedParent && m.status !== MissionStatus.COMPLETED) {
                    return { ...m, status: MissionStatus.LOCKED };
                }
                return m;
            });
        }
        
        return updatedMissions;
    });
  };

  const handleAddDependency = (childId: string, parentId: string) => {
      setMissions(prev => {
          const newMissions = prev.map(m => {
              if (m.id === childId && !m.dependencies.includes(parentId)) {
                  // Check if parent is completed
                  const parent = prev.find(p => p.id === parentId);
                  const isParentDone = parent?.status === MissionStatus.COMPLETED;
                  
                  return { 
                      ...m, 
                      dependencies: [...m.dependencies, parentId],
                      status: isParentDone ? m.status : MissionStatus.LOCKED // Lock only if parent isn't done
                  };
              }
              return m;
          });
          return newMissions;
      });
  };

  // EXPORT FUNCTIONALITY
  const handleExportGame = () => {
    const dataToSave = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        gameMode: currentMode,
        missions,
        heroes,
        stateLocations // Optional, but good for restoring map positions accurately if they changed
    };

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `lazaro_save_${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-dark-bg">
      
      {/* View Switcher Logic */}
      {viewMode === 'BUNKER' ? (
        <Bunker 
           heroes={heroes}
           missions={missions} // Pass all missions so we can assign cross-mode or filter inside
           onAddHero={handleAddHero}
           onUpdateHero={handleUpdateHero}
           onDeleteHero={handleDeleteHero}
           onClose={() => setViewMode('MAP')}
        />
      ) : (
        <>
          <main className="flex-1 relative transition-colors duration-700">
            <MapBoard 
              missions={visibleMissions} // Only pass filtered missions (Available/Completed)
              selectedMissionId={selectedMissionId}
              onMissionMove={handleMissionMove}
              onMissionSelect={handleMissionSelect}
              onBackgroundClick={handleBackgroundClick}
              onMapLayout={handleMapLayout}
              gameMode={currentMode}
            />
            
            {/* Overlay Title */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none text-center select-none z-0">
              <h2 className="text-5xl font-mono font-bold text-slate-800 tracking-widest uppercase opacity-30 drop-shadow-sm">
                CONTAGIO CERO
              </h2>
              <p className={`text-sm font-mono tracking-[0.8em] mt-2 font-bold ${currentMode === 'HEROES' ? 'text-blue-500/40' : 'text-green-500/40'}`}>
                MODO: {currentMode === 'HEROES' ? 'RESISTENCIA' : 'APOCALIPSIS'}
              </p>
            </div>
          </main>
          
          <aside className="h-full z-20 shadow-2xl">
            <ControlPanel 
              missions={visibleMissions}
              selectedMissionId={selectedMissionId}
              onAddMission={handleAddMission}
              onDeleteMission={handleDeleteMission}
              onUpdateStatus={handleUpdateStatus}
              onAddDependency={handleAddDependency}
              onUpdateMission={handleUpdateMission}
              onDeselect={handleBackgroundClick}
              onSelectMission={handleMissionSelect}
              stateLocations={stateLocations}
              currentMode={currentMode}
              onSetMode={handleModeChange}
              onToggleBunker={() => setViewMode('BUNKER')}
              onExportGame={handleExportGame}
            />
          </aside>
        </>
      )}
    </div>
  );
};

export default App;
