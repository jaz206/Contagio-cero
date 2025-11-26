
import React from 'react';
import { Terminal } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void; // Callback to notify App.tsx that login/access is successful
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-200 font-mono">
      <div className="absolute inset-0 scanlines"></div>
      <div className="absolute inset-0 vignette"></div>

      <div className="relative z-10 p-8 max-w-lg w-full bg-slate-900 border border-slate-700 rounded-lg shadow-2xl text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Terminal size={48} className="text-blue-500 mb-4 animate-pulse-slow" />
        <h1 className="text-3xl font-bold mb-2 text-white uppercase tracking-wider">
          ACCESO INICIATIVA LÁZARO
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Protocolo de seguridad activo. Identificación necesaria para continuar.
        </p>

        <button
          onClick={onLoginSuccess} // Call the passed callback on button click
          className="px-8 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold uppercase rounded-md shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg flex items-center gap-2"
        >
          ACCEDER
        </button>
      </div>
    </div>
  );
};

export default LoginPage;