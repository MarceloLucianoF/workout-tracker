import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/AuthContext';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- GRÁFICO DE LINHA (SVG Puro) ---
const WeightChart = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 text-sm">
        <span>📉</span>
        <p>Registre pelo menos 2 medidas para ver o gráfico.</p>
      </div>
    );
  }

  // Configs
  const height = 200;
  const width = 600; // ViewBox width
  const padding = 20;

  // Escalas
  const maxVal = Math.max(...data.map(d => d.value)) + 2; // +2kg de respiro
  const minVal = Math.min(...data.map(d => d.value)) - 2; // -2kg de respiro
  const range = maxVal - minVal || 1;

  // Pontos (X, Y)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  // Pontos para Área (Gradiente abaixo da linha)
  const areaPoints = `${padding},${height} ${points} ${width - padding},${height}`;

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Evolução de Peso</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Área Sombreada */}
        <polygon points={areaPoints} fill="url(#gradient)" />

        {/* Linha Guia Média */}
        <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="5" opacity="0.3" />

        {/* Linha Principal */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />

        {/* Pontos (Bolinhas) */}
        {data.map((d, i) => {
           const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
           const y = height - ((d.value - minVal) / range) * (height - padding * 2) - padding;
           return (
             <g key={i} className="group cursor-pointer">
               <circle cx={x} cy={y} r="4" className="fill-white stroke-blue-500 stroke-2 group-hover:r-6 transition-all" />
               <rect x={x - 20} y={y - 35} width="40" height="20" rx="4" fill="black" className="opacity-0 group-hover:opacity-80 transition-opacity" />
               <text x={x} y={y - 21} textAnchor="middle" fill="white" fontSize="10" className="opacity-0 group-hover:opacity-100 pointer-events-none font-bold">
                 {d.value}kg
               </text>
             </g>
           );
        })}
      </svg>
      
      {/* Legenda X (Datas) */}
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-mono px-2">
         <span>{data[0].dateFormatted}</span>
         <span>{data[data.length-1].dateFormatted}</span>
      </div>
    </div>
  );
};

export default function MeasurementsPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'measurements'),
        where('userId', '==', user.uid),
        orderBy('date', 'asc')
      );
      const snap = await getDocs(q);
      
      const data = snap.docs.map(doc => {
          const d = doc.data();
          return {
              id: doc.id,
              ...d,
              value: Number(d.weight), // Garante número para o gráfico
              dateFormatted: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          };
      });

      setHistory(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    const toastId = toast.loading("Salvando...");
    try {
        const weightValue = parseFloat(newWeight.replace(',', '.'));
        const now = new Date().toISOString();

        // 1. Salva no histórico
        await addDoc(collection(db, 'measurements'), {
            userId: user.uid,
            weight: weightValue,
            date: now,
            type: 'weight'
        });

        // 2. Atualiza o peso atual no Perfil do Usuário (Para a Home)
        await updateDoc(doc(db, 'users', user.uid), {
            weight: weightValue,
            lastMeasurementDate: now
        });

        toast.success("Peso registrado! ⚖️", { id: toastId });
        setNewWeight('');
        setShowInput(false);
        fetchHistory(); // Recarrega gráfico

    } catch (error) {
        toast.error("Erro ao salvar", { id: toastId });
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Apagar este registro?")) return;
      try {
          await deleteDoc(doc(db, 'measurements', id));
          toast.success("Apagado.");
          fetchHistory();
      } catch (e) { toast.error("Erro ao apagar"); }
  };

  // Variação Total
  const startWeight = history.length > 0 ? history[0].value : 0;
  const currentWeight = history.length > 0 ? history[history.length - 1].value : 0;
  const diff = currentWeight - startWeight;

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold flex items-center gap-2">
                ← Voltar
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Medidas Corporais</h1>
            <div className="w-8"></div>
        </div>

        {/* Card Resumo */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Peso Atual</p>
                    <h2 className="text-4xl font-black">{currentWeight > 0 ? currentWeight : '--'} <span className="text-lg font-medium opacity-80">kg</span></h2>
                </div>
                {history.length > 1 && (
                    <div className={`text-right ${diff <= 0 ? 'text-green-300' : 'text-yellow-300'}`}>
                        <p className="text-2xl font-bold">{diff > 0 ? '+' : ''}{diff.toFixed(1)}kg</p>
                        <p className="text-[10px] uppercase opacity-80">Desde o início</p>
                    </div>
                )}
            </div>
            <div className="absolute -right-4 -bottom-8 text-8xl opacity-10 rotate-12">⚖️</div>
        </div>

        {/* Botão Adicionar (Toggle) */}
        {!showInput ? (
            <button 
                onClick={() => setShowInput(true)}
                className="w-full bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold py-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
                <span>➕</span> Registrar Novo Peso
            </button>
        ) : (
            <form onSubmit={handleAddMeasurement} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-blue-100 dark:border-blue-900 animate-fade-in-down">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Novo Peso (kg)</label>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        step="0.1" 
                        value={newWeight} 
                        onChange={e => setNewWeight(e.target.value)} 
                        placeholder="Ex: 75.5" 
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold text-lg"
                        autoFocus
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold">Salvar</button>
                    <button type="button" onClick={() => setShowInput(false)} className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 rounded-lg font-bold">✕</button>
                </div>
            </form>
        )}

        {/* Gráfico */}
        <WeightChart data={history} />

        {/* Histórico Lista */}
        <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4 ml-1">Histórico Recente</h3>
            <div className="space-y-3">
                {[...history].reverse().map((item) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center shadow-sm border border-gray-50 dark:border-gray-700 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                                {item.value}
                            </div>
                            <div>
                                <p className="text-gray-800 dark:text-white font-bold text-sm">Registro de Peso</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(item.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}