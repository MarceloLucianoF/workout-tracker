import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function WeeklyChart({ data }) {
  // Se não tiver dados, mostra estado vazio
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Sem dados de treino esta semana</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        Treinos na Semana 📅
      </h3>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              hide 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px', 
                color: '#fff' 
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.count > 0 ? '#3B82F6' : '#E5E7EB'} // Azul se tiver treino, cinza se não
                  className="dark:opacity-80 transition-all hover:opacity-100"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}