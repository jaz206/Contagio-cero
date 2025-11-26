import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
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
  
  const [currentZoom, setCurrentZoom] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [hoveredMissionId, setHoveredMissionId] = useState<string | null>(null);
  const [mouseCoords, setMouseCoords] = useState<Coordinates>({ x: 0, y: 0 });

  // Load Map Data
  useEffect(() => {
    fetch(US_TOPOJSON_URL)
      .then(response => response.json())
      .then(topology => {
        const states = topojson.feature(topology, topology.objects.states);
        setGeoData(states);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  // Projection setup
  const projection = useMemo(() => {
    // fitExtent with padding ensures map is centered and doesn't touch edges
    return d3.geoAlbersUsa().fitExtent([[50, 50], [950, 550]], geoData || { type: "FeatureCollection", features: [] });
  }, [geoData]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

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

      const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.5, 40]) // Allow deep zoom (up to 40x) and slight zoom out (0.5x)
          // Removed translateExtent to prevent blocking
          .on('zoom', (event) => {
              if (contentGroupRef.current) {
                  d3.select(contentGroupRef.current).attr('transform', event.transform);
                  setCurrentZoom(event.transform);
              }
          });

      const selection = d3.select(svgRef.current);
      selection.call(zoom);
      selection.on("dblclick.zoom", null);

      return () => {
          selection.on('.zoom', null);
      };
  }, []);

  // Helper to get Color by Zone
  const getStateColor = (stateName: string) => {
    const zoneId = STATE_ZONE_MAPPING[stateName];
    const zone = BOSS_ZONES.find(z => z.id === zoneId);
    if (gameMode === 'ZOMBIES') {
        if (!zone) return '#1a2e1a'; 
        return zone.color; 
    }
    return zone ? zone.color : '#334155'; 
  };

  // Render State Names
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
                  // Counter-scale font so it stays readable but doesn't get massive when zooming in
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
          fontSize={50}
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

        const path = d3.path();
        path.moveTo(parent.position.x, parent.position.y);
        const midX = (parent.position.x + mission.position.x) / 2;
        const midY = (parent.position.y + mission.position.y) / 2 - 50; 
        path.quadraticCurveTo(midX, midY, mission.position.x, mission.position.y);

        return (
          <g key={`${parent.id}-${mission.id}`}>
            <path d={path.toString()} fill="none" stroke="#000" strokeWidth={4 / currentZoom.k} opacity="0.5" />
            <path
              d={path.toString()}
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

  // Track mouse coordinates for calibration
  const handleGlobalMouseMove = (e: React.MouseEvent) => {
      // Always track coordinates if calibrating
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

  // Detect Drag vs Click for Mission Selection
  const hasDraggedRef = useRef(false);

  return (
    <div ref={containerRef} className={`w-full h-full relative overflow-hidden select-none transition-colors duration-700 ${gameMode === 'ZOMBIES' ? 'bg-[#050a05]' : 'bg-dark-bg'}`}>
      
      {/* Calibration Controls */}
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

      {/* Loading State */}
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
        onMouseDown={() => { hasDraggedRef.current = false; }}
        onClick={(e) => {
            // Only trigger background click if we haven't dragged significantly
            if (!hasDraggedRef.current) {
                onBackgroundClick();
            }
        }}
      >
        <defs>
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" transform="translate(0,0)" fill="black" opacity="0.3"></rect>
          </pattern>
        </defs>

        {/* Ghost Rect to catch all mouse events for Zooming/Panning even on empty space */}
        <rect width={dimensions.width} height={dimensions.height} fill="transparent" />

        <g ref={contentGroupRef} transform={currentZoom.toString()}>
            
            {/* Map Layer */}
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
            {geoData && (
                <path 
                d={pathGenerator(geoData) || ''} 
                fill={gameMode === 'ZOMBIES' ? "url(#hatch)" : "none"}
                stroke={gameMode === 'ZOMBIES' ? '#4ade80' : '#3b82f6'}
                strokeWidth={0.5 / currentZoom.k} 
                opacity="0.3"
                />
            )}
            </g>

            <g>{renderZoneWatermarks()}</g>
            <g>{renderStateLabels()}</g>
            {renderConnections()}

            {/* Tokens Layer */}
            {missions.map((mission) => {
                const isSelected = selectedMissionId === mission.id;
                const isHovered = hoveredMissionId === mission.id;
                let Icon = AlertTriangle;
                let color = "text-yellow-400";
                let ringColor = "stroke-yellow-400";
                let dotFill = "#facc15"; // yellow-400

                if(mission.status === MissionStatus.COMPLETED) {
                    Icon = CheckCircle;
                    color = "text-green-500";
                    ringColor = "stroke-green-500";
                    dotFill = "#10b981"; // green-500
                } else if (mission.status === MissionStatus.LOCKED) {
                    Icon = Lock;
                    color = "text-slate-500";
                    ringColor = "stroke-slate-500";
                    dotFill = "#64748b"; // slate-500
                } else {
                    Icon = Target;
                }

                // LEVEL OF DETAIL LOGIC
                // If zoom is less than 2.5, show simple DOT
                const showDetail = currentZoom.k > 2.5;

                return (
                    <g
                    key={mission.id}
                    transform={`translate(${mission.position.x}, ${mission.position.y})`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMissionId(mission.id)}
                    onMouseLeave={() => setHoveredMissionId(null)}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Click logic: only select if not dragging map
                        onMissionSelect(mission.id);
                    }} 
                    >
                    
                    {showDetail ? (
                        // FULL TOKEN VIEW (Zoomed In)
                        <g transform={`scale(${1 / Math.sqrt(currentZoom.k)})`}>
                            {isSelected && (
                                <circle r="26" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow origin-center" />
                            )}
                            <circle 
                                r="20" 
                                fill="#0f172a" 
                                strokeWidth="3" 
                                className={`${ringColor} hover:stroke-white transition-colors duration-200`} 
                                stroke="currentColor" 
                            />
                            <foreignObject x="-12" y="-12" width="24" height="24" className="pointer-events-none">
                                <div className={`flex items-center justify-center w-full h-full ${color}`}>
                                    <Icon size={24} />
                                </div>
                            </foreignObject>
                            <text
                                y="40"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                fontFamily="Chakra Petch"
                                className="drop-shadow-md bg-black/50 pointer-events-none"
                                style={{ textShadow: '2px 2px 2px #000' }}
                            >
                                {mission.title}
                            </text>
                        </g>
                    ) : (
                        // DOT VIEW (Zoomed Out)
                        <g>
                             {/* Larger invisible hit area for easier clicking */}
                             <circle r={10 / currentZoom.k} fill="transparent" />
                             {/* Visible dot */}
                             <circle 
                                r={5 / Math.sqrt(currentZoom.k)} 
                                fill={dotFill} 
                                stroke="#0f172a"
                                strokeWidth={1 / currentZoom.k}
                                className="transition-transform duration-200 hover:scale-150"
                             />
                             {/* Hover Title in Dot Mode */}
                             {isHovered && (
                                 <g transform={`scale(${1 / Math.sqrt(currentZoom.k)})`}>
                                     <rect x={-(mission.title.length * 3.5)} y="-28" width={mission.title.length * 7} height="16" rx="2" fill="rgba(0,0,0,0.8)" />
                                     <text
                                         y="-16"
                                         textAnchor="middle"
                                         fill="white"
                                         fontSize="10"
                                         fontFamily="Chakra Petch"
                                         fontWeight="bold"
                                         className="pointer-events-none drop-shadow-md"
                                     >
                                         {mission.title}
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