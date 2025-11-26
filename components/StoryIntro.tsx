
import React, { useState, useEffect } from 'react';
import { GameMode } from '../types';
import { ChevronRight, SkipForward, Activity, Shield, Biohazard } from 'lucide-react';

interface StoryIntroProps {
  onComplete: (mode: GameMode) => void;
}

const SCENES = [
  {
    id: 1,
    image: "https://i.pinimg.com/1200x/18/99/ec/1899ec756f8731e015eb941d7122fbec.jpg",
    text: " No hubo trompetas. No hubo cielos rojos ni profecías antiguas cumpliéndose. El fin del mundo no vino del espacio exterior, ni de una dimensión oscura.\nLo construimos nosotros. Aquí. En casa."
  },
  {
    id: 2,
    image: "https://i.pinimg.com/1200x/71/06/7d/71067db72856dfd6ca03d0d51a679bd6.jpg",
    text: "O mejor dicho, lo construyeron ellos.\nTres hombres se reunieron bajo luces fluorescentes: Doom, Magneto y Fisk.\nDecidieron que la humanidad era demasiado caótica. Su solución fue el PULSO NULIFICADOR."
  },
  {
    id: 3,
    image: "https://i.pinimg.com/1200x/99/80/1e/99801e7603e4a770127ce29530f13f87.jpg",
    text: " Necesitaban cuerpos para afinar la fórmula. Usaron a mutantes y criminales para ver cómo se multiplicaba la infección.\nY funcionó. Dios, cómo funcionó."
  },
  {
    id: 4,
    image: "https://i.pinimg.com/1200x/19/26/53/1926533335a2b27c4a79c9d2632ec83d.jpg",
    text: " Pero la arrogancia siempre apunta hacia atrás.\nDecidieron probar su obra maestra en Bruce Banner. Buscaban una fuente de energía infinita..."
  },
  {
    id: 5,
    image: "https://i.pinimg.com/736x/cf/f1/de/cff1deef61e1fb966db87e788e70935b.jpg",
    text: "...lo que consiguieron fue una bomba biológica. Cuando el virus tocó la sangre gamma, no murió. Se enfureció.\nBanner no cayó. La cosa que despertó ya no tenía a nadie al volante."
  },
  {
    id: 6,
    image: "https://i.pinimg.com/1200x/a8/e9/b7/a8e9b76d6a9a87de0cfba509d5fef534.jpg",
    text: "En cuestión de horas, Nueva York era un matadero. Los Vengadores cayeron primero, destrozados por los amigos que intentaban salvar.\nLos X-Men aguantaron un poco más, solo para ver cómo su escuela se convertía en un buffet."
  },
  {
    id: 7,
    image: "https://i.pinimg.com/1200x/eb/db/e8/ebdbe8d5738acd105654dc8ddad8216f.jpg",
    text: "¿Y la Tríada? Doom, Magneto y Fisk no perdieron la mente. Sus cuerpos se pudrieron, pero su intelecto permaneció intacto.\nAhora se sientan en tronos de huesos, gobernando facciones de pesadilla."
  },
  {
    id: 8,
    image: "https://i.pinimg.com/originals/b5/79/43/b5794321500237339759505300000735.jpg", // Reusing SHIELD/Hero image
    text: "Pero hay algo peor que los muertos. S.H.I.E.L.D. sigue activo.\nUna IA ciega, sorda y paranoica que ha decidido que la única forma de mantener el orden es eliminar todo lo que se mueva."
  },
  {
    id: 9,
    image: "https://i.pinimg.com/1200x/18/99/ec/1899ec756f8731e015eb941d7122fbec.jpg", // Reusing destroyed city image
    text: "Así que aquí estás. De pie sobre las cenizas.\nA tu izquierda, los muertos marchan. A tu derecha, las máquinas apuntan sus láseres.\nYa no se trata de salvar el mundo. Se trata de ver quién queda en pie."
  }
];

const StoryIntro: React.FC<StoryIntroProps> = ({ onComplete }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChoice, setShowChoice] = useState(false);

  const scene = SCENES[currentSceneIndex];
  const fullText = scene?.text || "";

  // Typewriter effect
  useEffect(() => {
    if (showChoice) return;
    
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const speed = 30; // ms per char

    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayedText(prev => prev + fullText.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [currentSceneIndex, fullText, showChoice]);

  const handleNext = () => {
    if (isTyping) {
      // Instant finish typing
      setDisplayedText(fullText);
      setIsTyping(false);
    } else {
      if (currentSceneIndex < SCENES.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
      } else {
        setShowChoice(true);
      }
    }
  };

  if (showChoice) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center p-8 relative overflow-hidden">
        {/* CRT Scanline Effect Overlay */}
        <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-20"></div>
        
        <div className="max-w-4xl w-full grid grid-cols-2 gap-8 z-10 animate-in zoom-in-95 duration-700">
          
          {/* OPTION A */}
          <button 
            onClick={() => onComplete('HEROES')}
            className="group relative h-96 border-2 border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900 overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-[url('https://i.pinimg.com/originals/b5/79/43/b5794321500237339759505300000735.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
            <div className="relative z-10 p-6 flex flex-col h-full justify-between text-left">
              <div>
                 <Shield className="w-12 h-12 text-blue-500 mb-4" />
                 <h2 className="text-3xl font-black text-white italic tracking-wider">EL HÉROE VIVO</h2>
              </div>
              <p className="font-mono text-sm text-blue-200 leading-relaxed bg-black/60 p-2 border-l-2 border-blue-500">
                "Aún respiro. Aún sangro. Mientras me queden balas, nadie va a convertir este mundo en su almuerzo."
              </p>
            </div>
          </button>

          {/* OPTION B */}
          <button 
             onClick={() => onComplete('ZOMBIES')}
             className="group relative h-96 border-2 border-slate-700 hover:border-green-500 bg-slate-900/50 hover:bg-slate-900 overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-[url('https://4.bp.blogspot.com/-_bqF03KQ67I/U2VB2KfpqnI/AAAAAAAACqI/1jZAV2qQBB8/s1600/00Wolverine.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay"></div>
             <div className="relative z-10 p-6 flex flex-col h-full justify-between text-left">
              <div>
                 <Biohazard className="w-12 h-12 text-green-500 mb-4" />
                 <h2 className="text-3xl font-black text-white italic tracking-wider">EL HÉROE ZOMBIE</h2>
              </div>
              <p className="font-mono text-sm text-green-200 leading-relaxed bg-black/60 p-2 border-l-2 border-green-500">
                "El dolor ha desaparecido. Solo queda el Hambre. No soy un monstruo; soy el siguiente paso de la evolución."
              </p>
            </div>
          </button>

        </div>
        
        <div className="absolute top-10 text-center z-10">
          <h1 className="text-2xl font-mono text-white tracking-[0.5em] font-bold typewriter">¿QUÉ ERES TÚ?</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black text-white flex flex-col relative font-mono overflow-hidden select-none" onClick={handleNext}>
      
      {/* CRT Effects */}
      <div className="scanlines absolute inset-0 pointer-events-none z-50 opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none z-20"></div>

      {/* Main Image Layer with CONTAINER FIX */}
      <div className="absolute inset-0 z-0 flex items-center justify-center p-4 pb-32">
         <img 
            key={scene.id}
            src={scene.image} 
            alt="Scene" 
            className="w-full h-full object-contain max-w-6xl mx-auto animate-in fade-in zoom-in-105 duration-[2000ms] shadow-2xl"
         />
      </div>

      {/* Text Container */}
      <div className="absolute bottom-0 w-full z-30 p-8 md:p-12 pb-16 flex flex-col items-center">
         <div className="max-w-3xl w-full bg-black/90 border-2 border-white/20 p-6 shadow-2xl backdrop-blur-sm relative">
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-yellow-500"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-yellow-500"></div>

            <p className="text-lg md:text-xl text-slate-200 font-bold leading-relaxed whitespace-pre-line min-h-[4rem]">
              {displayedText}
              <span className="animate-pulse text-yellow-500">_</span>
            </p>

            <div className="mt-4 flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest">
               <span className="flex items-center gap-2">
                 <Activity size={12} className="text-green-500 animate-pulse"/>
                 ARCHIVO: {scene.id.toString().padStart(2, '0')} / {SCENES.length.toString().padStart(2, '0')}
               </span>
               <div className="flex items-center gap-2">
                 <span>{isTyping ? 'DESCIFRANDO...' : 'CLIC PARA CONTINUAR'}</span>
                 <ChevronRight size={14} className={!isTyping ? "animate-bounce-right" : ""} />
               </div>
            </div>
         </div>
         
         <button 
           onClick={(e) => { e.stopPropagation(); setShowChoice(true); }}
           className="mt-6 text-slate-600 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 transition-colors z-40"
         >
           <SkipForward size={12}/> Saltar Intro
         </button>
      </div>

    </div>
  );
};

export default StoryIntro;
