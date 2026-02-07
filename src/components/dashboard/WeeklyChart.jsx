import React from 'react';

export default function WeeklyChart({ history }) {
  // Lógica para calcular treinos dos últimos 7 dias
  const getLast7Days = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      // Conta quantos treinos houve neste dia
      const count = history.filter(h => {
        const hDate = new Date(h.date);
        return hDate.getDate() === d.getDate() && 
               hDate.getMonth() === d.getMonth() && 
               hDate.getFullYear() === d.getFullYear();
      }).length;

      last7Days.push({
        day: days[d.getDay()],
        count: count,
        isToday: i === 0
      });
    }
    return last7Days;
  };

  const data = getLast7Days();
  const maxCount = Math.max(...data.map(d => d.count), 1); // Evita divisão por zero

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Frequência Semanal</h3>
      
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((item, index) => {
          // Calcula altura da barra (mínimo 10% para não sumir)
          const height = item.count > 0 ? (item.count / maxCount) * 100 : 5;
          
          return (
            <div key={index} className="flex flex-col items-center w-full group">
              
              {/* Tooltip com quantidade */}
              <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-800 text-white px-2 py-1 rounded">
                {item.count} treinos
              </div>

              {/* A Barra */}
              <div 
                className={`w-full max-w-[30px] rounded-t-lg transition-all duration-500 ease-out ${
                  item.count > 0 
                    ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-500' 
                    : 'bg-gray-100 dark:bg-gray-700'
                } ${item.isToday ? 'ring-2 ring-offset-2 ring-blue-400 dark:ring-offset-gray-800' : ''}`}
                style={{ height: `${height}%` }}
              ></div>
              
              {/* Dia da Semana */}
              <span className={`text-xs mt-3 font-medium ${
                item.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}