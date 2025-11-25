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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  // Store the current zoom transform to calculate drag positions correctly
  const [currentZoom, setCurrentZoom] = useState<d3.ZoomTransform>(d3.zoomIdentity);

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

  // Responsive D3 Setup
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDims);
    updateDims();
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Projection
  const projection = useMemo(() => {
    // Standard projection fitting the container
    return d3.geoAlbersUsa().fitSize([dimensions.width, dimensions.height], geoData || { type: "FeatureCollection", features: [] });
  }, [dimensions, geoData]);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Calculate centroids and notify parent
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
          .scaleExtent([1, 8]) // Zoom limits: 1x to 8x
          .translateExtent([[0, 0], [dimensions.width, dimensions.height]])
          .on('zoom', (event) => {
              if (contentGroupRef.current) {
                  d3.select(contentGroupRef.current).attr('transform', event.transform);
                  setCurrentZoom(event.transform);
              }
          });

      const selection = d3.select(svgRef.current);
      selection.call(zoom);
      
      // Disable double click zoom
      selection.on("dblclick.zoom", null);

      return () => {
          selection.on('.zoom', null);
      };
  }, [dimensions]); // Re-init zoom when dims change

  // Drag Handlers for Tokens
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent zoom trigger
    setIsDragging(id);
    onMissionSelect(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // We need to calculate the mouse position RELATIVE to the zoomed group content
      // formula: (screen_coord - zoom_translate) / zoom_scale
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const transformedX = (mouseX - currentZoom.x) / currentZoom.k;
      const transformedY = (mouseY - currentZoom.y) / currentZoom.k;

      onMissionMove(isDragging, { x: transformedX, y: transformedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Helper to get Color by Zone
  const getStateColor = (stateName: string) => {
    const zoneId = STATE_ZONE_MAPPING[stateName];
    const zone = BOSS_ZONES.find(z => z.id === zoneId);
    
    // In Zombies mode, desaturate standard colors and make them more toxic
    if (gameMode === 'ZOMBIES') {
        if (!zone) return '#1a2e1a'; // Dark green bg
        // Just a simple mapping or override for zombie mode
        // For simplicity, we use the same zone colors but maybe we could darken them
        return zone.color; 
    }
    
    return zone ? zone.color : '#334155'; // default slate-700
  };

  // Calculate Label Positions (State Names)
  const renderLabels = () => {
      if (!geoData) return null;
      return geoData.features.map((feature: any, i: number) => {
          const centroid = pathGenerator.centroid(feature);
          if (!centroid || isNaN(centroid[0])) return null;
          
          // Only show labels for states that are large enough or if zoomed in
          // This prevents clutter when fully zoomed out
          const shouldShow = currentZoom.k > 2 || (pathGenerator.area(feature) > 500);

          return (
              <text
                  key={`label-${i}`}
                  x={centroid[0]}
                  y={centroid[1]}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  fontSize={10 / Math.sqrt(currentZoom.k)} // Scale font down slightly as we zoom in so it doesn't get huge
                  className="pointer-events-none font-mono uppercase tracking-widest select-none"
                  style={{ opacity: shouldShow ? 1 : 0, transition: 'opacity 0.3s' }}
              >
                  {feature.properties.name}
              </text>
          );
      });
  };

  // Render Large Watermark Zone Labels
  const renderZoneWatermarks = () => {
    return ZONE_LABELS.map(label => {
      const coords = projection(label.coordinates as [number, number]);
      if (!coords) return null;
      
      const zone = BOSS_ZONES.find(z => z.id === label.id);

      // Calculate dynamic opacity based on zoom - fade out as we zoom in too much to avoid clutter
      // But keep base opacity high enough to be seen
      const opacity = Math.max(0.1, 0.3 - (currentZoom.k * 0.05));

      const lines = label.text.split('\n');

      return (
        <text
          key={`zone-wm-${label.id}`}
          x={coords[0]}
          y={coords[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={zone?.color || '#ffffff'}
          fillOpacity={opacity}
          fontSize={50}
          fontWeight="900"
          className="pointer-events-none font-mono tracking-[0.1em] uppercase select-none"
          style={{ 
             textShadow: '0 0 40px rgba(0,0,0,0.8)',
             transformOrigin: 'center',
          }}
        >
          {lines.map((line, i) => (
             <tspan 
                key={i} 
                x={coords[0]} 
                dy={i === 0 ? (lines.length > 1 ? "-0.6em" : "0") : "1.2em"}
             >
                {line}
             </tspan>
          ))}
        </text>
      );
    });
  };

  // Render Connections (Bezier Curves)
  const renderConnections = () => {
    return missions.flatMap(mission => 
      mission.dependencies.map(depId => {
        const parent = missions.find(m => m.id === depId);
        if (!parent) return null;

        const path = d3.path();
        path.moveTo(parent.position.x, parent.position.y);
        
        // Curve control point
        const midX = (parent.position.x + mission.position.x) / 2;
        const midY = (parent.position.y + mission.position.y) / 2 - 50; // curve upward
        
        path.quadraticCurveTo(midX, midY, mission.position.x, mission.position.y);

        return (
          <g key={`${parent.id}-${mission.id}`}>
             {/* Halo for visibility */}
            <path
              d={path.toString()}
              fill="none"
              stroke="#000"
              strokeWidth={4 / currentZoom.k} // Keep stroke width consistent visually
              opacity="0.5"
            />
            <path
              d={path.toString()}
              fill="none"
              stroke={mission.status === MissionStatus.LOCKED ? '#94a3b8' : '#facc15'}
              strokeWidth={2 / currentZoom.k}
              strokeDasharray={mission.status === MissionStatus.LOCKED ? "5,5" : "none"}
              markerEnd={`url(#arrow-${mission.status})`}
            />
          </g>
        );
      })
    );
  };

  return (
    <div ref={containerRef} className={`w-full h-full relative overflow-hidden select-none transition-colors duration-700 ${gameMode === 'ZOMBIES' ? 'bg-[#050a05]' : 'bg-dark-bg'}`}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={onBackgroundClick} // Clicking empty space deselects
      >
        <defs>
          <marker id="arrow-AVAILABLE" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#facc15" />
          </marker>
          <marker id="arrow-LOCKED" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
          </marker>
          <marker id="arrow-COMPLETED" markerWidth="10" markerHeight="10" refX="22" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
          </marker>
          {/* Pattern for zombies mode maybe? */}
          <pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" transform="translate(0,0)" fill="black" opacity="0.3"></rect>
          </pattern>
        </defs>

        {/* Group that gets transformed by Zoom/Pan */}
        <g ref={contentGroupRef}>
            
            {/* Map Layer */}
            <g className="opacity-80 transition-all duration-700">
            {geoData && geoData.features.map((feature: any, i: number) => (
                <path
                key={i}
                d={pathGenerator(feature) || ''}
                fill={getStateColor(feature.properties.name)}
                stroke={gameMode === 'ZOMBIES' ? '#2f4f2f' : '#1e293b'}
                strokeWidth={1 / currentZoom.k} // Dynamic stroke width
                className="transition-colors duration-300 hover:brightness-110"
                fillOpacity={gameMode === 'ZOMBIES' ? "0.15" : "0.2"}
                />
            ))}
            {/* Borders / Overlay */}
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

            {/* Zone Watermarks Layer (Overlay on map, but under tokens) */}
            <g>{renderZoneWatermarks()}</g>

            {/* State Names Layer */}
            <g>{renderLabels()}</g>

            {/* Connections Layer */}
            {renderConnections()}

            {/* Tokens Layer */}
            {missions.map((mission) => {
                const isSelected = selectedMissionId === mission.id;
                let Icon = AlertTriangle;
                let color = "text-yellow-400";
                let ringColor = "stroke-yellow-400";
                
                if(mission.status === MissionStatus.COMPLETED) {
                    Icon = CheckCircle;
                    color = "text-green-500";
                    ringColor = "stroke-green-500";
                } else if (mission.status === MissionStatus.LOCKED) {
                    Icon = Lock;
                    color = "text-slate-500";
                    ringColor = "stroke-slate-500";
                } else {
                    Icon = Target;
                }

                // Scale tokens inversely to zoom so they remain readable but attached to map
                const scale = 1 / Math.sqrt(currentZoom.k); 

                return (
                    <g
                    key={mission.id}
                    transform={`translate(${mission.position.x}, ${mission.position.y}) scale(${scale})`}
                    className="cursor-pointer transition-opacity duration-200 hover:opacity-100 opacity-90"
                    onMouseDown={(e) => handleMouseDown(e, mission.id)}
                    onClick={(e) => e.stopPropagation()} 
                    >
                    {/* Selection Ring */}
                    {isSelected && (
                        <circle r="26" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 2" className="animate-spin-slow origin-center" />
                    )}
                    
                    {/* Token Background */}
                    <circle 
                        r="20" 
                        fill="#0f172a" 
                        strokeWidth="3" 
                        className={`${ringColor} hover:stroke-white transition-colors duration-200`} 
                        stroke="currentColor" 
                    />
                    
                    {/* Icon */}
                    <foreignObject x="-12" y="-12" width="24" height="24" className="pointer-events-none">
                        <div className={`flex items-center justify-center w-full h-full ${color}`}>
                            <Icon size={24} />
                        </div>
                    </foreignObject>

                    {/* Label - Shows below token */}
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
                );
            })}
        </g>
      </svg>
      
      {/* HUD Info */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-slate-500 text-xs font-mono">
         ZOOM: {currentZoom.k.toFixed(1)}x <br/>
         COORDS: {isDragging ? 'UPDATING...' : 'STABLE'} <br/>
         MODE: {gameMode}
      </div>
      
      {/* Zoom Hints */}
      <div className="absolute top-4 right-4 pointer-events-none text-slate-600 text-[10px] font-mono border border-slate-800 p-2 bg-slate-900/80 rounded">
          <p>RUEDA DEL RATÓN: ZOOM</p>
          <p>ARRASTRAR FONDO: MOVER MAPA</p>
          <p>ARRASTRAR TOKEN: MOVER MISIÓN</p>
      </div>
    </div>
  );
};

export default MapBoard;