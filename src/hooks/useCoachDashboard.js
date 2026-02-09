import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useCoachDashboard = (user) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: { active: 0, revenue: 0, checkIns: 0, risk: 0, retention: 0 },
        recentActivity: [],
        studentsAtRisk: [],
        financials: []
    });

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!user) return;

            try {
                // 1. Check-ins Recentes
                const qCheckIns = query(collection(db, 'checkIns'), orderBy('date', 'desc'), limit(50));
                const checkInsSnap = await getDocs(qCheckIns);
                
                // CORREÇÃO AQUI: Mapear incluindo o ID do documento
                const rawCheckIns = checkInsSnap.docs.map(d => ({ 
                    id: d.id, // ✅ Importante para navegação
                    ...d.data() 
                }));

                // Filtra Check-ins de HOJE
                const today = new Date();
                today.setHours(0,0,0,0);
                const todayCheckIns = rawCheckIns.filter(c => new Date(c.date) >= today);

                // 2. Buscar Alunos
                const qStudents = query(collection(db, 'users'), where('role', '!=', 'admin'));
                const studentsSnap = await getDocs(qStudents);
                const allStudents = studentsSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

                // 3. Risco / Churn
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                const studentLastWorkout = {};
                rawCheckIns.forEach(c => {
                    if (!studentLastWorkout[c.userId]) studentLastWorkout[c.userId] = new Date(c.date);
                });

                const atRisk = [];
                let activeCount = 0;

                allStudents.forEach(student => {
                    const lastDate = studentLastWorkout[student.uid];
                    if (!lastDate || lastDate < oneWeekAgo) {
                        atRisk.push({
                            ...student,
                            daysInactive: lastDate ? Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24)) : 'Novo',
                            lastWorkoutDate: lastDate
                        });
                    } else {
                        activeCount++;
                    }
                });

                // 4. Stats
                const totalStudents = allStudents.length || 1;
                const retentionRate = Math.round((activeCount / totalStudents) * 100);
                const estimatedRevenue = allStudents.length * 120;

                setData({
                    stats: {
                        active: allStudents.length,
                        revenue: estimatedRevenue,
                        checkIns: todayCheckIns.length,
                        risk: atRisk.length,
                        retention: retentionRate
                    },
                    recentActivity: todayCheckIns,
                    studentsAtRisk: atRisk.slice(0, 5),
                    financials: [40, 60, 45, 70, 85, 60, 75]
                });

            } catch (error) {
                console.error("Erro useCoachDashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [user]);

    return { ...data, loading };
};