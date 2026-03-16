import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { /* Sua config aqui */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchConsolidado() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];

    // Obter início da semana (segunda-feira)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));

    const consolidado = {}; // { matricula: { diario: 0, semanal: 0, mensal: 0, cancelados: 0 } }

    try {
        const querySnapshot = await getDocs(collection(db, "atendimentos"));
        
        for (const dayDoc of querySnapshot.docs) {
            const dateParts = dayDoc.id.split('-');
            const docDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

            // Filtrar apenas o mês atual
            if (docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
                
                const operadoresSnap = await getDocs(collection(db, `atendimentos/${dayDoc.id}/operadores`));
                
                for (const opDoc of operadoresSnap.docs) {
                    const matricula = opDoc.id;
                    const ligacoesSnap = await getDocs(collection(db, `atendimentos/${dayDoc.id}/operadores/${matricula}/ligacoes`));
                    
                    if (!consolidado[matricula]) {
                        consolidado[matricula] = { diario: 0, semanal: 0, mensal: 0, cancelados: 0 };
                    }

                    ligacoesSnap.forEach(l => {
                        const data = l.data();
                        consolidado[matricula].mensal++;
                        if (data.result === "Cancelado") consolidado[matricula].cancelados++;
                        
                        if (dayDoc.id === todayStr) consolidado[matricula].diario++;
                        if (docDate >= startOfWeek) consolidado[matricula].semanal++;
                    });
                }
            }
        }
        renderTable(consolidado);
    } catch (e) {
        console.error("Erro na gestão:", e);
    }
}

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    Object.keys(data).forEach(mat => {
        const user = data[mat];
        const taxa = user.mensal > 0 ? ((user.cancelados / user.mensal) * 100).toFixed(1) : 0;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${mat}</strong></td>
            <td>${user.diario}</td>
            <td>${user.semanal}</td>
            <td>${user.mensal}</td>
            <td>
                <span class="rate-badge" style="background: ${getRateColor(taxa)}">
                    ${taxa}%
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRateColor(taxa) {
    if (taxa <= 12.5) return "#10b981"; // Verde
    if (taxa <= 14) return "#f59e0b";   // Amarelo
    return "#ef4444";                  // Vermelho
}

fetchConsolidado();
