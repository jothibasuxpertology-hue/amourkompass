import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, X, Heart, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface UserMatch {
  uid: string;
  name: string;
  location?: Location;
  zodiac?: string;
}

interface SoulmateGlobeProps {
  userUid: string;
  userLocation: Location | null;
  matches: UserMatch[];
  allMatches?: UserMatch[];
  rotation: [number, number, number];
  onRotationChange: (rotation: [number, number, number]) => void;
  onMatchSelect?: (match: UserMatch) => void;
  onClose: () => void;
}

const SoulmateGlobe: React.FC<SoulmateGlobeProps> = ({ userUid, userLocation, matches, allMatches = [], rotation, onRotationChange, onMatchSelect, onClose }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const rotationRef = useRef<[number, number, number]>(rotation);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Determine which matches to show and navigate through
  const displayMatches = (matches.length > 1 ? matches : allMatches).filter(m => m && m.uid && m.uid !== userUid);
  const activeMatch = matches.length === 1 ? matches[0] : displayMatches[currentIndex];

  useEffect(() => {
    if (matches.length === 1) {
      const idx = displayMatches.findIndex(m => m.uid === matches[0].uid);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [matches, displayMatches]);

  // Update ref when prop changes (if needed, but usually we update ref from drag)
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => setWorldData(data));
  }, []);

  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const width = 600;
    const height = 600;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoOrthographic()
      .scale(250)
      .translate([width / 2, height / 2])
      .rotate(rotationRef.current);

    const path = d3.geoPath().projection(projection);

    // Add drag behavior
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on('start', () => {
        // Optional: pause auto-rotation or handle start
      })
      .on('drag', (event) => {
        const rotate = projection.rotate();
        const k = 75 / projection.scale();
        projection.rotate([
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k
        ]);
        rotationRef.current = projection.rotate() as [number, number, number];
        onRotationChange(rotationRef.current);
        svg.selectAll('path').attr('d', path);
        updatePoints(0); // Update points immediately during drag
      });

    svg.call(drag as any);

    // Background circle for the globe
    svg.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale())
      .attr('fill', '#FFF5F5') // Very light pink
      .attr('stroke', '#FFD7D7')
      .attr('stroke-width', 1);

    // Graticule (grid lines)
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('class', 'graticule')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#FFD7D7')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.5);

    // Landmasses
    const countries = topojson.feature(worldData, worldData.objects.countries) as any;
    svg.append('path')
      .datum(countries)
      .attr('d', path)
      .attr('fill', '#FFE4E1') // Misty Rose
      .attr('stroke', '#FFB6C1') // Light Pink
      .attr('stroke-width', 0.5);

    // Draw connections
    if (userLocation) {
      matches.forEach(match => {
        if (match.location) {
          const start: [number, number] = [userLocation.lng, userLocation.lat];
          const end: [number, number] = [match.location.lng, match.location.lat];
          
          const link = { type: 'LineString', coordinates: [start, end] } as any;
          
          // Arc line with glow effect
          const lineId = `line-${match.uid}`;
          
          // Glow filter
          const filter = svg.append('defs')
            .append('filter')
            .attr('id', `glow-${match.uid}`);
          filter.append('feGaussianBlur')
            .attr('stdDeviation', '2.5')
            .attr('result', 'coloredBlur');
          const feMerge = filter.append('feMerge');
          feMerge.append('feMergeNode').attr('in', 'coloredBlur');
          feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

          svg.append('path')
            .datum(link)
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#E86B6B')
            .attr('stroke-width', 3)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.6)
            .attr('filter', `url(#glow-${match.uid})`)
            .attr('class', 'connection-line-glow');

          svg.append('path')
            .datum(link)
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#FFD7D7')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.9)
            .attr('class', 'connection-line-core');
        }
      });
    }

    // Animation loop
    let animationId: number;
    let lastTime = 0;
    
    const updatePoints = (time: number) => {
      // Update points and labels
      svg.selectAll('.match-point-group').remove();
      svg.selectAll('.user-point-group').remove();

      if (userLocation) {
        // Redraw match points
        const currentMatches = matches.length === 1 ? [activeMatch] : displayMatches;
        currentMatches.forEach(match => {
          if (match.location) {
            const end: [number, number] = [match.location.lng, match.location.lat];
            const matchPoint = projection(end);
            const isVisible = d3.geoDistance(projection.rotate().map(d => -d) as [number, number], end) < Math.PI / 2;
            
            if (matchPoint && isVisible) {
              const g = svg.append('g').attr('class', 'match-point-group');
              
              // Pulse effect
              const pulseScale = 1 + Math.sin(time / 200) * 0.3;
              g.append('circle')
                .attr('cx', matchPoint[0])
                .attr('cy', matchPoint[1])
                .attr('r', 8 * pulseScale)
                .attr('fill', '#E86B6B')
                .attr('opacity', 0.3);

              g.append('circle')
                .attr('cx', matchPoint[0])
                .attr('cy', matchPoint[1])
                .attr('r', 4)
                .attr('fill', '#E86B6B')
                .attr('stroke', 'white')
                .attr('stroke-width', 1);
              
              g.append('text')
                .attr('x', matchPoint[0] + 12)
                .attr('y', matchPoint[1] + 4)
                .text(match.name)
                .attr('font-size', '10px')
                .attr('font-weight', 'bold')
                .attr('fill', '#4A4A3A')
                .attr('font-family', 'sans-serif');
            }
          }
        });

        // Redraw user point
        const userCoords: [number, number] = [userLocation.lng, userLocation.lat];
        const userPoint = projection(userCoords);
        const isUserVisible = d3.geoDistance(projection.rotate().map(d => -d) as [number, number], userCoords) < Math.PI / 2;
        
        if (userPoint && isUserVisible) {
          const g = svg.append('g').attr('class', 'user-point-group');
          
          // Pulse effect
          const pulseScale = 1 + Math.sin(time / 200) * 0.2;
          g.append('circle')
            .attr('cx', userPoint[0])
            .attr('cy', userPoint[1])
            .attr('r', 12 * pulseScale)
            .attr('fill', '#D4A373')
            .attr('opacity', 0.2);

          g.append('circle')
            .attr('cx', userPoint[0])
            .attr('cy', userPoint[1])
            .attr('r', 6)
            .attr('fill', '#D4A373')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
          
          g.append('text')
            .attr('x', userPoint[0] + 14)
            .attr('y', userPoint[1] + 4)
            .text('You')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', '#4A4A3A')
            .attr('font-family', 'sans-serif');
        }
      }
    };

    const animate = (time: number) => {
      // Slow down auto-rotation if needed, or just let it run
      rotationRef.current[0] += 0.1; // Rotate longitude
      projection.rotate(rotationRef.current);
      onRotationChange(rotationRef.current);
      
      svg.selectAll('path').attr('d', path);
      updatePoints(time);

      animationId = requestAnimationFrame(animate);
    };

    updatePoints(0);
    requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [worldData, userLocation, matches]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-[#4A4A3A]/40 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] border-2 border-[#FFD7D7] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-[#FFD7D7]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFF5F5] rounded-2xl text-[#E86B6B]">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-[#4A4A3A]">Soulmate Connections</h2>
              <p className="text-xs text-[#8C8970] font-sans uppercase tracking-widest font-bold">Global Alignment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#FFF5F5] rounded-xl transition-colors text-[#8C8970]"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden bg-[#FFF5F5]/30">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#E86B6B_0%,transparent_70%)] opacity-10" />
            
            {/* Floating Hearts */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  scale: Math.random() * 0.5 + 0.5,
                  opacity: Math.random() * 0.3 + 0.1
                }}
                animate={{ 
                  y: [null, "-20px", "20px", "0px"],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute text-[#E86B6B]"
              >
                <Heart size={16 + Math.random() * 16} fill="currentColor" />
              </motion.div>
            ))}
          </div>
          
          <svg 
            ref={svgRef} 
            width="600" 
            height="600" 
            viewBox="0 0 600 600"
            className="max-w-full h-auto drop-shadow-2xl cursor-grab active:cursor-grabbing"
          />

          {displayMatches.length > 1 && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
              <button 
                onClick={() => {
                  const newIdx = (currentIndex - 1 + displayMatches.length) % displayMatches.length;
                  setCurrentIndex(newIdx);
                  if (onMatchSelect) onMatchSelect(displayMatches[newIdx]);
                }}
                className="p-3 bg-white/80 backdrop-blur-md rounded-full border border-[#FFD7D7] text-[#E86B6B] shadow-lg pointer-events-auto hover:bg-white transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <button 
                onClick={() => {
                  const newIdx = (currentIndex + 1) % displayMatches.length;
                  setCurrentIndex(newIdx);
                  if (onMatchSelect) onMatchSelect(displayMatches[newIdx]);
                }}
                className="p-3 bg-white/80 backdrop-blur-md rounded-full border border-[#FFD7D7] text-[#E86B6B] shadow-lg pointer-events-auto hover:bg-white transition-all"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#FFD7D7] shadow-sm">
              <div className="w-3 h-3 bg-[#D4A373] rounded-full border border-white" />
              <span className="text-xs font-bold text-[#4A4A3A]">Your Location</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#FFD7D7] shadow-sm">
              <div className="w-3 h-3 bg-[#E86B6B] rounded-full border border-white" />
              <span className="text-xs font-bold text-[#4A4A3A]">Soulmate Match</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#FFF5F5]/50 border-t border-[#FFD7D7] flex flex-col items-center gap-4">
          {activeMatch && (
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-[#FFD7D7] shadow-sm">
              <div className="w-8 h-8 bg-[#E86B6B] rounded-xl flex items-center justify-center text-white font-serif italic">
                {activeMatch.name[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#4A4A3A]">{activeMatch.name}</p>
                <p className="text-[10px] text-[#8C8970] uppercase tracking-widest">{activeMatch.zodiac}</p>
              </div>
              <button 
                onClick={() => {
                  if (onMatchSelect) onMatchSelect(activeMatch);
                  onClose();
                }}
                className="ml-4 px-4 py-2 bg-[#E86B6B] text-white rounded-xl text-xs font-bold hover:bg-[#D45A5A] transition-colors"
              >
                Go to Chat
              </button>
            </div>
          )}
          <p className="text-sm text-[#8C8970] font-serif italic">
            "Distance is just a test to see how far love can travel."
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SoulmateGlobe;
