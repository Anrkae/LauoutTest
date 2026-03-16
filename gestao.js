import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collectionGroup, 
    getDocs,
    query,
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-f7KfWUq9bcusIHmqTpSDq0S-4rC7lqs",
    authDomain: "claro-ret.firebaseapp.com",
    projectId: "claro-ret",
    storageBucket: "claro-ret.firebasestorage.app",
    messagingSenderId: "218601890292",
    appId: "1:218601890292:web:31e30552518c20ff8d19a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função auxiliar para pegar a data no seu formato YYYY-MM-DD
function getTodayId() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function fetchConsolidado() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const todayStr = getTodayId();

    // Início da semana (segunda-feira)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const consolidado = {};

    try {
        /* MELHORIA: Usamos collectionGroup para buscar TODAS as coleções chamadas "ligacoes" 
           independente de qual operador ou dia elas pertençam.
        */
        const ligacoesQuery = query(collectionGroup(db, "ligacoes"));
        const querySnapshot = await getDocs(ligacoesQuery);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const matricula = data.operator; // Usando o campo 'operator' que você salva no objeto
            
            // Extrair data do timestamp ou do campo string
            const [dia, mes, ano] = data.date.split('/'); // Seu formato é dd/mm/aaaa
            const docDate = new Date(ano, mes - 1, dia);

            // Filtrar apenas o mês e ano atual
            if (parseInt(mes) === currentMonth && parseInt(ano) === currentYear) {
                
                if (!consolidado[matricula]) {
                    consolidado[matricula] = { diario: 0, semanal: 0, mensal: 0, cancelados: 0 };
                }

                // Total Mensal
                consolidado[matricula].mensal++;
                
                // Cancelados (para a taxa)
                if (data.result === "Cancelado") {
                    consolidado[matricula].cancelados++;
                }

                // Diário
                // Comparamos a data da ligação com a data de hoje formatada
                const formattedDocDate = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
                if (formattedDocDate === todayStr) {
                    consolidado[matricula].diario++;
                }

                // Semanal
                if (docDate >= startOfWeek) {
                    consolidado[matricula].semanal++;
                }
            }
        });

        renderTable(consolidado);
        updateHeaderStats(consolidado);

    } catch (e) {
        console.error("Erro ao buscar dados:", e);
    }
}

// ... manter funções renderTable, updateHeaderStats e getRateColor do código anterior ...

function updateHeaderStats(data) {
    let totalMensal = 0;
    let totalCancelados = 0;

    Object.values(data).forEach(u => {
        totalMensal += u.mensal;
        totalCancelados += u.cancelados;
    });

    const taxaGeral = totalMensal > 0 ? ((totalCancelados / totalMensal) * 100).toFixed(1) : 0;
    
    document.getElementById("grandTotal").textContent = totalMensal;
    document.getElementById("avgRate").textContent = taxaGeral + "%";
}

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    const sorted = Object.keys(data).sort((a, b) => data[b].mensal - data[a].mensal);

    sorted.forEach(mat => {
        const user = data[mat];
        const taxa = user.mensal > 0 ? ((user.cancelados / user.mensal) * 100).toFixed(1) : 0;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span style="color: #3b82f6; font-weight: bold;">${mat}</span></td>
            <td>${user.diario}</td>
            <td>${user.semanal}</td>
            <td>${user.mensal}</td>
            <td>
                <span style="background: ${getRateBadgeColor(taxa)}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                    ${taxa}%
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRateBadgeColor(taxa) {
    const t = parseFloat(taxa);
    if (t <= 12.5) return "#10b981"; 
    if (t <= 14) return "#f59e0b";
    return "#ef4444";
}

fetchConsolidado();
