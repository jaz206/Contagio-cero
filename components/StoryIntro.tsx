import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, ShieldAlert, FileText, Terminal } from 'lucide-react';

interface Scene {
  id: number;
  image: string;
  text: string;
  caption?: string;
}

const STORY_SCENES: Scene[] = [
  {
    id: 1,
    image: 'https://i.pinimg.com/1200x/18/99/ec/1899ec756f8731e015eb941d7122fbec.jpg',
    text: "No hubo trompetas. No hubo cielos rojos ni profecías antiguas cumpliéndose. El fin del mundo no vino del espacio exterior, ni de una dimensión oscura. Lo construimos nosotros. Aquí. En casa.",
    caption: "MARVEL ZOMBIES: CONTAGIO CERO - Libro I: El Legado de la Arrogancia"
  },
  {
    id: 2,
    image: 'https://i.pinimg.com/1200x/71/06/7d/71067db72856dfd6ca03d0d51a679bd6.jpg',
    text: "O mejor dicho, lo construyeron ellos. Fue en un laboratorio estéril, bajo luces fluorescentes que zumbaban como moscas.",
    caption: "NEW YORK - ZONA CERO"
  },
  {
    id: 3,
    image: 'https://i.pinimg.com/1200x/99/80/1e/99801e7603e4a770127ce29530f13f87.jpg',
    text: "Tres hombres se reunieron allí: Victor Von Doom, Magneto y Wilson Fisk. Tres egos tan grandes que apenas cabían en la misma habitación. Decidieron que la humanidad era demasiado caótica. Su solución fue el Pulso Nulificador. Necesitaban cuerpos para afinar la fórmula. Usaron a Jamie Madrox para ver cómo se multiplicaba la infección. Usaron a los Reavers para ver si el metal podía enfermar. Y funcionó.... Dios, cómo funcionó.",
    caption: "LA TRÍADA DE LA ARROGANCIA"
  },
  {
    id: 4,
    image: 'https://i.pinimg.com/1200x/19/26/53/1926533335a2b27c4a79c9d2632ec83d.jpg',
    text: "Necesitaban cuerpos para afinar la fórmula. Usaron a Jamie Madrox para ver cómo se multiplicaba la infección. Usaron a los Reavers para ver si el metal podía enfermar. Y funcionó. Dios, cómo funcionó.",
    caption: "EXPERIMENTOS CLASIFICADOS"
  },
  {
    id: 5,
    image: 'https://i.pinimg.com/736x/cf/f1/de/cff1deef61e1fb966db87e788e70935b.jpg',
    text: "Pero la arrogancia es una pistola cargada que siempre apunta hacia atrás. Decidieron probar su obra maestra en Bruce Banner. Buscaban una fuente de energía infinita...",
    caption: "EL PACIENTE CERO"
  },
  {
    id: 6,
    image: 'https://i.pinimg.com/1200x/a8/e9/b7/a8e9b76d6a9a87de0cfba509d5fef534.jpg',
    text: "...lo que consiguieron fue una bomba biológica. Cuando el virus tocó la sangre gamma, no murió. Se enfureció. Banner no cayó. La cosa que despertó —esa montaña de músculo verde y rabia— ya no tenía a nadie al volante. El estallido no fue de fuego, fue de contagio.",
    caption: "FALLO DE CONTENCIÓN"
  },
  {
    id: 7,
    image: 'https://i.pinimg.com/1200x/eb/db/e8/ebdbe8d5738acd105654dc8ddad8216f.jpg',
    text: "En cuestión de horas, Nueva York era un matadero. Los Vengadores cayeron primero, destrozados por los amigos que intentaban salvar. Los X-Men aguantaron un poco más, solo para ver cómo su escuela se convertía en un buffet libre.",
    caption: "EL FIN"
  },
  {
    id: 8,
    image: 'https://i.pinimg.com/1200x/71/06/7d/71067db72856dfd6ca03d0d51a679bd6.jpg',
    text: "En cuestión de horas, Nueva York era un matadero. Los Vengadores cayeron primero, destrozados por los amigos que intentaban salvar. Los X-Men aguantaron un poco más, solo para ver cómo su escuela se convertía en un buffet libre.",
    caption: "CAÍDA DE HÉROES"
  },
  {
    id: 9,
    image: 'https://i.pinimg.com/1200x/99/80/1e/99801e7603e4a770127ce29530f13f87.jpg',
    text: "¿Y la Tríada? No perdieron la mente. Sus cuerpos se pudrieron, pero su intelecto permaneció intacto, afilado y hambriento. Ahora gobiernan facciones de pesadilla: Doomsberg, el Edén Roto y el Imperio de la Carne.",
    caption: "LOS NUEVOS REYES"
  },
  {
    id: 10,
    image: 'https://cdnb.artstation.com/p/assets/images/images/024/956/983/large/luca-pizzari-shield-helicarrier-color.jpg?1584097863',
    text: "Pero hay algo más ahí fuera. Cuando la gente murió, las máquinas no se apagaron. S.H.I.E.L.D. sigue activo. Nick Fury está muerto. Pero el 'Protocolo Lázaro' sigue corriendo en servidores enterrados.",
    caption: "LA IA VIGILANTE"
  },
  {
    id: 11,
    image: 'https://i.pinimg.com/originals/b5/79/43/b579436825492c3872336c70676407f2.jpg',
    text: "S.H.I.E.L.D. ya no es una agencia; es un fantasma armado. Una inteligencia artificial paranoica que ha decidido que la única forma de mantener el orden es eliminar todo lo que se mueva. Si estás en su zona, eres una amenaza.",
    caption: "PROTOCOLO LÁZARO"
  },
  {
    id: 12,
    image: 'https://i.pinimg.com/originals/b5/79/43/b579436825492c3872336c70676407f2.jpg',
    text: "Así que aquí estás. De pie sobre las cenizas. A tu izquierda, los muertos marchan. A tu derecha, los sistemas de defensa apuntan sus láseres. Ya no se trata de salvar el mundo. Se trata de ver quién queda en pie.",
    caption: "TU ELECCIÓN"
  }
];

interface StoryIntroProps {
  onClose: () => void;
}

const StoryIntro: React.FC<StoryIntroProps> = ({ onClose }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scene = STORY_SCENES[currentSceneIndex];

  // Typewriter effect
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const speed = 30; // ms per char

    const timer = setInterval(() => {
      if (i < scene.text.length) {
        setDisplayedText(scene.text.substring(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [currentSceneIndex]);

  const handleNext = () => {
    if (currentSceneIndex < STORY_SCENES.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    // If typing, finish typing immediately
    if (isTyping) {
        setDisplayedText(scene.text);
        setIsTyping(false);
        return;
    }
    // If finished typing, go to next
    handleNext();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden font-mono" onClick={handleSkip}>
      
      {/* Visual Effects */}
      <div className="scanlines"></div>
      <div className="vignette"></div>
      
      {/* Background Image (Blurred) */}
      <div className="absolute inset-0 opacity-20 scale-110 blur-sm transition-all duration-1000" 
           style={{ backgroundImage: `url(${scene.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      </div>

      {/* Content Container */}
      <div className="relative z-50 w-full max-w-5xl h-[85vh] flex flex-col bg-slate-950 border-2 border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header - SHIELD STYLE */}
        <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-yellow-500">
                <ShieldAlert size={18} className="animate-pulse"/>
                <span className="text-xs tracking-[0.2em] font-bold">S.H.I.E.L.D. ARCHIVE // CLASSIFIED: LEVEL 9</span>
            </div>
            <div className="flex gap-2">
                <span className="text-xs text-slate-500">{currentSceneIndex + 1} / {STORY_SCENES.length}</span>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-500 hover:text-white">
                    <X size={18}/>
                </button>
            </div>
        </div>

        {/* Comic Panel Area */}
        <div className="flex-1 relative bg-black p-8 flex items-center justify-center">
            {/* The Image */}
            <div className="relative w-full h-full max-h-[60vh] border-4 border-white shadow-lg overflow-hidden group">
                <img 
                    src={scene.image} 
                    alt="Story Panel" 
                    className="w-full h-full object-contain bg-black transition-transform duration-[10s] ease-linear transform scale-100 group-hover:scale-110"
                />
                
                {/* Caption Box (Comic Style) */}
                {scene.caption && (
                    <div className="absolute top-0 left-0 bg-yellow-500 text-black px-3 py-1 text-xs font-bold uppercase tracking-wider border-b-2 border-r-2 border-black shadow-md">
                        {scene.caption}
                    </div>
                )}
            </div>
        </div>

        {/* Text Area */}
        <div className="h-48 bg-slate-900 border-t border-slate-700 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
            
            <p className="text-lg md:text-xl text-slate-200 font-serif leading-relaxed tracking-wide">
                {displayedText}
                <span className="inline-block w-2 h-5 bg-yellow-500 ml-1 animate-typewriter align-middle"></span>
            </p>

            {/* Navigation Controls */}
            <div className="absolute bottom-4 right-4 flex gap-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    disabled={currentSceneIndex === 0}
                    className="flex items-center gap-1 text-xs uppercase font-bold text-slate-500 hover:text-white disabled:opacity-20 transition-colors"
                >
                    <ChevronLeft size={14}/> Anterior
                </button>
                
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600/50 text-yellow-500 hover:bg-yellow-600 hover:text-white rounded text-xs uppercase font-bold transition-all animate-pulse"
                >
                    {currentSceneIndex === STORY_SCENES.length - 1 ? "INICIAR PROTOCOLO" : "Siguiente"} 
                    <ChevronRight size={14}/>
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StoryIntro;