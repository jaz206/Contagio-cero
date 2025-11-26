
import React from 'react';
import { Skull, Map, BookOpen, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onStartGame: () => void;
  onViewStory: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStartGame, onViewStory }) => {
  return (
    <div className="fixed inset-0 z-[90] bg-dark-bg flex items-center justify-center font-mono">
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute inset-0 vignette"></div>

      <div className="relative z-10 p-8 max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Skull size={64} className="text-green-500 mb-4 animate-pulse-slow" />
        <h1 className="text-4xl font-bold mb-2 text-white uppercase tracking-wider">
          CONTAGIO CERO
        </h1>
        <p className="text-md text-slate-400 mb-8 leading-relaxed">
          El mundo ha caído. ¿Serás un héroe o un monstruo?
        </p>

        <div className="flex flex-col space-y-4 w-full max-w-sm">
          <button
            onClick={onStartGame}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold uppercase rounded-md shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg flex items-center justify-center gap-3"
          >
            <Map size={20} /> INICIAR OPERACIÓN
          </button>
          <button
            onClick={onViewStory}
            className="px-6 py-3 bg-yellow-700/20 hover:bg-yellow-700/40 text-yellow-400 border border-yellow-700 font-bold uppercase rounded-md shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg flex items-center justify-center gap-3"
          >
            <BookOpen size={20} /> VER ARCHIVO S.H.I.E.L.D.
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;