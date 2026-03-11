import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const firebaseConfig = {
  
  apiKey: "AIzaSyA-f7KfWUq9bcusIHmqTpSDq0S-4rC7lqs",
  authDomain: "claro-ret.firebaseapp.com",
  projectId: "claro-ret",
  storageBucket: "claro-ret.firebasestorage.app",
  messagingSenderId: "218601890292",
  appId: "1:218601890292:web:31e30552518c20ff8d19a1"
  
}


const app = initializeApp(firebaseConfig)
const db = getFirestore(app)


/* DATA DO DIA */

function getTodayId() {
  
  const d = new Date()
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  
  return `${year}-${month}-${day}`
  
}


/* SALVAR ATENDIMENTO */

async function salvarAtendimento(matricula, data) {
  
  try {
    
    const today = getTodayId()
    
    const dayDoc = doc(db, "atendimentos", today)
    
    const operadorDoc = doc(dayDoc, "operadores", matricula)
    
    const ligacoes = collection(operadorDoc, "ligacoes")
    
    await addDoc(ligacoes, data)
    
    console.log("Ligação salva")
    
  } catch (e) {
    
    console.error("Erro Firebase:", e)
    
  }
  
}


/* BUSCAR LIGAÇÕES DO DIA */

async function buscarLigacoes(matricula) {
  
  try {
    
    const today = getTodayId()
    
    const dayDoc = doc(db, "atendimentos", today)
    
    const operadorDoc = doc(dayDoc, "operadores", matricula)
    
    const ligacoes = collection(operadorDoc, "ligacoes")
    
    const snapshot = await getDocs(ligacoes)
    
    let lista = []
    
    snapshot.forEach(doc => {
      
      lista.push(doc.data())
      
    })
    
    return lista
    
  } catch (e) {
    
    console.error("Erro ao buscar:", e)
    
    return []
    
  }
  
}


window.salvarAtendimento = salvarAtendimento
window.buscarLigacoes = buscarLigacoes