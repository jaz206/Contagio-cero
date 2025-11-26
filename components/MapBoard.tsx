
import React, { useEffect, useRef, useState, useMemo } from 'react';
// Fix: Import d3 modules specifically to resolve type and property errors
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { zoom, zoomIdentity, ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { pie, arc, PieArcDatum } from 'd3-shape';
import * as topojson from 'topojson-client'; // FIX: Import topojson-client

import { Mission, Coordinates, MissionStatus, GameMode } from '../types';
import { US_TOPOJSON_URL, STATE_ZONE_MAPPING, BOSS_ZONES, ZONE_LABELS } from '../constants';
import { Target, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

interface MapBoardProps {
  missions: Mission[];
  selectedMissionId: string | null;
  onMissionMove: (id: string, pos: Coordinates) => void;
  onMissionSelect: (id: string) => void;
  onBackgroundClick: () => void;
  onMapLayout?: (stateLocations: Record<string, Coordinates>) => void;
  gameMode: GameMode;
}

const MapBoard: React.FC<MapBoardProps> = ({
  missions,
  selectedMissionId,
  onMissionMove,
  onMissionSelect,
  onBackgroundClick,
  onMapLayout,
  gameMode
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentGroupRef = useRef<SVGGElement>(null);
  
  const [geoData, setGeoData] = useState<any>(null);
  // Fixed internal coordinate system
  const dimensions = { width: 1000, height: 600 };
  
  // Fix: Use imported ZoomTransform type and zoomIdentity directly
  const [currentZoom, setCurrentZoom] = useState<ZoomTransform>(zoomIdentity);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null); // Hover logic for groups
  const [mouseCoords, setMouseCoords] = useState<Coordinates>({ x: 0, y: 0 });

  // Load Map Data
  useEffect(() => {
    fetch(US_TOPOJSON_URL)
      .then(response => response.json())
      .then(topology => {
        // Fix: topojson is now imported
        const states = topojson.feature(topology, topology.objects.states); 
        setGeoData(states);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Projection setup
  const projection = useMemo(() => {
    // Fix: Use imported geoAlbersUsa directly
    return geoAlbersUsa().fitExtent([[50, 50], [950, 550]], geoData || { type: "FeatureCollection", features: [] });
  }, [geoData]);

  const pathGenerator = useMemo(() => {
    // Fix: Use imported geoPath directly
    return geoPath().projection(projection);
  }, [projection]);

  // GROUPING LOGIC: Group missions by exact coordinates
  const groupedMissions = useMemo(() => {
    const groups: Record<string, Mission[]> = {};
    missions.forEach(m => {
        const key = `${m.position.x.toFixed(1)},${m.position.y.toFixed(1)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });
    return Object.values(groups);
  }, [missions]);

  // HELPER: Find the "Active" mission in a group to display main info
  const getActiveMissionInGroup = (group: Mission[]) => {
      // Sort group to ensure consistent pie segment order (e.g., by ID or a custom order)
      const sortedGroup = [...group].sort((a, b) => a.id.localeCompare(b.id));

      const selected = sortedGroup.find(m => m.id === selectedMissionId);
      if (selected) return selected;

      const available = sortedGroup.find(m => m.status === MissionStatus.AVAILABLE);
      if (available) return available;

      const locked = sortedGroup.find(m => m.status === MissionStatus.LOCKED);
      if (locked) return locked;

      return sortedGroup[sortedGroup.length - 1]; // Fallback to last one
  };

  // Calculate centroids
  useEffect(() => {
      if (geoData && onMapLayout && pathGenerator) {
          const locations: Record<string, Coordinates> = {};
          geoData.features.forEach((feature: any) => {
              const centroid = pathGenerator.centroid(feature);
              if (centroid && !isNaN(centroid[0])) {
                  locations[feature.properties.name] = { x: centroid[0], y: centroid[1] };
              }
          });
          onMapLayout(locations);
      }
  }, [geoData, pathGenerator, onMapLayout]);

  // Zoom Behavior
  useEffect(() => {
      if (!svgRef.current || !contentGroupRef.current) return;

      // Fix: Use imported zoom and select directly
      const d3zoom = zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.5, 40]) // Deep zoom
          .on('zoom', (event) => {
              if (contentGroupRef.current) {
                  select(contentGroupRef.current).attr('transform', event.transform);
                  setCurrentZoom(event.transform);
              }
          });

      const selection = select(svgRef.current);
      selection.call(d3zoom);
      selection.on("dblclick.zoom", null);
      // Remove all translateExtent to allow infinite panning
      d3zoom.translateExtent([[-100000, -100000], [100000, 100000]]);


      return () => {
          selection.on('.zoom', null);
      };
  }, []);

  const getStateColor = (stateName: string) => {
    const zoneId = STATE_ZONE_MAPPING[stateName];
    const zone = BOSS_ZONES.find(z => z.id === zoneId);
    if (gameMode === 'ZOMBIES') {
        if (!zone) return '#1a2e1a'; 
        return zone.color; 
    }
    return zone ? zone.color : '#334155'; 
  };

  const renderStateLabels = () => {
      if (!geoData) return null;
      return geoData.features.map((feature: any, i: number) => {
          const centroid = pathGenerator.centroid(feature);
          if (!centroid || isNaN(centroid[0])) return null;
          
          return (
              <text
                  key={`label-${i}`}
                  x={centroid[0]}
                  y={centroid[1]}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.6)"
                  fontSize={10} 
                  transform={`scale(${1/Math.sqrt(Math.max(1, currentZoom.k))})`}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  className="pointer-events-none font-mono uppercase tracking-widest select-none"
              >
                  {feature.properties.name}
              </text>
          );
      });
  };

  const renderZoneWatermarks = () => {
    return ZONE_LABELS.map(label => {
      const coords = projection(label.coordinates as [number, number]);
      if (!coords) return null;
      const zone = BOSS_ZONES.find(z => z.id === label.id);
      const lines = label.text.split('\n');

      return (
        <text
          key={`zone-wm-${label.id}`}
          x={coords[0]}
          y={coords[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={zone?.color || '#ffffff'}
          fillOpacity={0.15} 
          fontSize={30} // Reduced from 50
          fontWeight="900"
          className="pointer-events-none font-mono tracking-[0.1em] uppercase select-none"
          style={{ textShadow: '0 0 40px rgba(0,0,0,0.8)' }}
        >
          {lines.map((line, i) => (
             <tspan key={i} x={coords[0]} dy={i === 0 ? (lines.length > 1 ? "-0.6em" : "0") : "1.2em"}>{line}</tspan>
          ))}
        </text>
      );
    });
  };

  const renderConnections = () => {
    return missions.flatMap(mission => 
      mission.dependencies.map(depId => {
        const parent = missions.find(m => m.id === depId);
        if (!parent) return null;

        // Fix: Use imported path directly
        const d3path = new Path2D();
        d3path.moveTo(parent.position.x, parent.position.y);
        const midX = (parent.position.x + mission.position.x) / 2;
        const midY = (parent.position.y + mission.position.y) / 2 - 50; 
        d3path.quadraticCurveTo(midX, midY, mission.position.x, mission.position.y);

        return (
          <g key={`${parent.id}-${mission.id}`}>
            <path d={d3path.toString()} fill="none" stroke="#000" strokeWidth={4 / currentZoom.k} opacity="0.5" />
            <path
              d={d3path.toString()}
              fill="none"
              stroke={mission.status === MissionStatus.LOCKED ? '#94a3b8' : '#facc15'}
              strokeWidth={2 / currentZoom.k}
              strokeDasharray={mission.status === MissionStatus.LOCKED ? "5,5" : "none"}
            />
          </g>
        );
      })
    );
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
      if (isCalibrating) {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const viewBoxScaleX = dimensions.width / rect.width;
          const viewBoxScaleY = dimensions.height / rect.height;
          const mouseX = (e.clientX - rect.left) * viewBoxScaleX;
          const mouseY = (e.clientY - rect.top) * viewBoxScaleY;
          
          const transformedX = (mouseX - currentZoom.x) / currentZoom.k;
          const transformedY = (mouseY - currentZoom.y) / currentZoom.k;
          
          setMouseCoords({ x: transformedX, y: transformedY });
      }
  };

  // D3 Pie Generator for multi-mission tokens
  // Fix: Use imported pie and arc directly
  const pieGenerator = pie<Mission>().value(1).sort(null);
  const arcGenerator = arc<PieArcDatum<Mission>>()
    .innerRadius(0) 
    .outerRadius(9); // Matches the base circle radius

  const getMissionColor = (status: MissionStatus) => {
      switch (status) {
          case MissionStatus.COMPLETED: return "#10b981"; // green-500
          case MissionStatus.AVAILABLE: return "#facc15"; // yellow-400
          case MissionStatus.LOCKED: return "#64748b"; // slate-500
          default: return "#facc15";
      }
  };

  return (
    <div ref={containerRef} className={`w-full h-full relative overflow-hidden select-none transition-colors duration-700 ${gameMode === 'ZOMBIES' ? 'bg-[#050a05]' : 'bg-dark-bg'}`}>
      
      {/* Calibration Info */}
      <div className="absolute top-20 right-4 z-50 flex flex-col gap-2 items-end">
        <button 
            onClick={() => setIsCalibrating(!isCalibrating)}
            className={`text-[10px] font-mono px-2 py-1 border rounded transition-colors ${isCalibrating ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500' : 'bg-slate-900/50 text-slate-500 border-slate-700'}`}
        >
            {isCalibrating ? '🔧 CALIBRANDO...' : '🔧 CALIBRAR'}
        </button>
        {isCalibrating && (
             <div className="bg-slate-900/90 border border-cyan-500/50 rounded p-2 text-cyan-400 font-mono text-xs shadow-lg backdrop-blur-sm">
                 <div className="flex gap-4">
                     <span>X: <strong className="text-white">{Math.round(mouseCoords.x)}</strong></span>
                     <span>Y: <strong className="text-white">{Math.round(mouseCoords.y)}</strong></span>
                 </div>
             </div>
        )}
      </div>

      {!geoData && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-sm animate-pulse">
              Inicializando Satélites...
          </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className={`w-full h-full ${isCalibrating ? 'cursor-crosshair' : 'cursor-move'}`}
        onMouseMove={handleGlobalMouseMove}
        onClick={(e) => {
            // Only trigger onBackgroundClick if not calibrating and not clicking a mission
            if (!isCalibrating && (e.target as Element).tagName === 'rect') { // Check if clicking the background rect
                onBackgroundClick();
            }
        }}
      >
        <defs>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" transform="translate(0,0)" fill="black" opacity="0.3"></rect>
          </pattern>
        </defs>

        {/* Background rect to capture clicks and mousemove over empty space */}
        <rect 
            x="0" 
            y="0" 
            width={dimensions.width} 
            height={dimensions.height} 
            fill="transparent" 
            className="pointer-events-auto" // Ensure it captures events
        />

        <g ref={contentGroupRef} transform={currentZoom.toString()}>
            
            <g className="opacity-80 transition-all duration-700">
            {geoData && geoData.features.map((feature: any, i: number) => (
                <path
                key={i}
                d={pathGenerator(feature) || ''}
                fill={getStateColor(feature.properties.name)}
                stroke={gameMode === 'ZOMBIES' ? '#2f4f2f' : '#1e293b'}
                strokeWidth={1 / currentZoom.k}
                className="transition-colors duration-300 hover:brightness-110"
                fillOpacity={gameMode === 'ZOMBIES' ? "0.15" : "0.2"}
                />
            ))}
            </g>

            <g>{renderZoneWatermarks()}</g>
            <g>{renderStateLabels()}</g>
            {renderConnections()}

            {/* TOKENS LAYER: Grouped */}
            {groupedMissions.map((group, index) => {
                const activeMission = getActiveMissionInGroup(group);
                const isSelected = group.some(m => m.id === selectedMissionId);
                const isHovered = hoveredGroupId === activeMission.id;
                const showDetail = currentZoom.k > 2.5;

                // Determine Icon
                let Icon = AlertTriangle;
                if(activeMission.status === MissionStatus.COMPLETED) Icon = CheckCircle;
                else if (activeMission.status === MissionStatus.LOCKED) Icon = Lock;
                else Icon = Target;

                const isGroup = group.length > 1;
                const arcs = isGroup ? pieGenerator(group) : [];

                return (
                    <g
                        key={`group-${index}`}
                        transform={`translate(${activeMission.position.x}, ${activeMission.position.y})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredGroupId(activeMission.id)}
                        onMouseLeave={() => setHoveredGroupId(null)}
                        onClick={(e) => {
                            e.stopPropagation();
                            // Select the active mission in the group
                            onMissionSelect(activeMission.id);
                        }}
                    >
                        {showDetail ? (
                            // DETAILED VIEW (Zoomed In)
                            <g transform={`scale(${1 / Math.sqrt(currentZoom.k)})`}>
                                {/* Selection Ring */}
                                {isSelected && (
                                    <circle r="13" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="3 1.5" className="animate-spin-slow origin-center" />
                                )}
                                
                                {/* Group (Pie) or Single Token */}
                                {isGroup ? (
                                    <g>
                                        <circle r="9" fill="#0f172a" stroke="none" />
                                        {arcs.map((arc, i) => (
                                            <path 
                                                key={i} 
                                                d={arcGenerator(arc) || ''} 
                                                fill={getMissionColor(arc.data.status)} 
                                                stroke="#0f172a" 
                                                strokeWidth="1"
                                                className="transition-colors"
                                            />
                                        ))}
                                    </g>
                                ) : (
                                    <circle 
                                        r="9" 
                                        fill="#0f172a" 
                                        strokeWidth="1.5" 
                                        stroke={getMissionColor(activeMission.status)} 
                                        className="hover:stroke-white transition-colors duration-200"
                                    />
                                )}

                                {/* Icon Overlay */}
                                <foreignObject x="-5" y="-5" width="10" height="10" className="pointer-events-none">
                                    <div className={`flex items-center justify-center w-full h-full text-white drop-shadow-md`}>
                                        <Icon size={10} strokeWidth={2.5} />
                                    </div>
                                </foreignObject>

                                {/* Title Label */}
                                <text
                                    y="16"
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="6"
                                    fontFamily="Chakra Petch"
                                    className="drop-shadow-md bg-black/50 pointer-events-none"
                                    style={{ textShadow: '1px 1px 1px #000' }}
                                >
                                    {isGroup ? `${activeMission.title} (+${group.length-1})` : activeMission.title}
                                </text>
                            </g>
                        ) : (
                             // DOT VIEW (Zoomed Out)
                            <g>
                                <circle r={10 / currentZoom.k} fill="transparent" />
                                <circle 
                                    r={5 / Math.sqrt(currentZoom.k)} 
                                    fill={getMissionColor(activeMission.status)} 
                                    stroke="#0f172a"
                                    strokeWidth={1 / currentZoom.k}
                                    className="transition-transform duration-200 hover:scale-150"
                                />
                                {isHovered && (
                                    <g transform={`scale(${1 / Math.sqrt(currentZoom.k)})`}>
                                        <rect x={-(activeMission.title.length * 3.5)} y="-28" width={activeMission.title.length * 7} height="16" rx="2" fill="rgba(0,0,0,0.8)" />
                                        <text
                                            y="-16"
                                            textAnchor="middle"
                                            fill="white"
                                            fontSize="10"
                                            fontFamily="Chakra Petch"
                                            fontWeight="bold"
                                            className="pointer-events-none drop-shadow-md"
                                        >
                                            {activeMission.title} {isGroup && "(Grupo)"}
                                        </text>
                                    </g>
                                )}
                            </g>
                        )}
                    </g>
                );
            })}
        </g>
      </svg>
      
      <div className="absolute bottom-4 left-4 pointer-events-none text-slate-500 text-xs font-mono">
         ZOOM: {currentZoom.k.toFixed(1)}x <br/>
         MODE: {gameMode} <br/>
         {isCalibrating && <span className="text-cyan-400 animate-pulse">MODO CALIBRACIÓN ACTIVO</span>}
      </div>
      
      <div className="absolute top-4 right-4 pointer-events-none text-slate-600 text-[10px] font-mono border border-slate-800 p-2 bg-slate-900/80 rounded">
          <p>RUEDA: ZOOM (0.5x - 40x)</p>
          <p>ARRASTRAR: MOVER MAPA</p>
      </div>
    </div>
  );
};

export default MapBoard;