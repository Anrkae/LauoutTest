import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// COPIE EXATAMENTE OS DADOS DO SEU OUTRO ARQUIVO AQUI:
const firebaseConfig = {
  apiKey: "AIzaSyA-f7KfWUq9bcusIHmqTpSDq0S-4rC7lqs",
  authDomain: "claro-ret.firebaseapp.com",
  projectId: "claro-ret",
  storageBucket: "claro-ret.firebasestorage.app",
  messagingSenderId: "218601890292",
  appId: "1:218601890292:web:31e30552518c20ff8d19a1"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchConsolidado() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = new Date().toISOString().split('T')[0]; // Ajuste para fuso local se necessário

    // Define o início da semana (segunda-feira)
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0,0,0,0);

    const consolidado = {};

    try {
        // 1. Pega os dias (documentos na raiz de 'atendimentos')
        const querySnapshot = await getDocs(collection(db, "atendimentos"));
        
        // Usamos for...of para lidar com o async/await corretamente
        for (const dayDoc of querySnapshot.docs) {
            const dateParts = dayDoc.id.split('-'); // Esperado: YYYY-MM-DD
            const docDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

            // Só processa se for do mês atual
            if (docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear) {
                
                // 2. Entra em cada operador do dia
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
                        
                        if (data.result === "Cancelado") {
                            consolidado[matricula].cancelados++;
                        }
                        
                        // Incrementa diário se o ID do documento for hoje
                        if (dayDoc.id === todayStr) {
                            consolidado[matricula].diario++;
                        }
                        
                        // Incrementa semanal se a data do documento for maior ou igual à segunda-feira
                        if (docDate >= startOfWeek) {
                            consolidado[matricula].semanal++;
                        }
                    });
                }
            }
        }
        renderTable(consolidado);
        updateHeaderStats(consolidado);
    } catch (e) {
        console.error("Erro ao processar dados:", e);
    }
}

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

    // Ordenar por maior volume mensal
    const sortedMatriculas = Object.keys(data).sort((a, b) => data[b].mensal - data[a].mensal);

    sortedMatriculas.forEach(mat => {
        const user = data[mat];
        const taxa = user.mensal > 0 ? ((user.cancelados / user.mensal) * 100).toFixed(1) : 0;
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="user-badge">${mat}</span></td>
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
    const t = parseFloat(taxa);
    if (t <= 12.5) return "rgba(16, 185, 129, 0.2)"; // Verde suave
    if (t <= 14.5) return "rgba(245, 158, 11, 0.2)"; // Amarelo suave
    return "rgba(239, 68, 68, 0.2)";                // Vermelho suave
}

// Iniciar busca
fetchConsolidado();
