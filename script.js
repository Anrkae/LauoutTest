let pipWindow=null
let callInterval=null
let seconds=0

let selectedResult=null
let history=[]

let matricula=null


/* LOGIN */

async function login(){

const input = document.getElementById("matriculaInput")

if(!input.value.trim()){

alert("Digite a matrícula")
return

}

matricula = input.value.trim()

loginScreen.classList.add("hidden")
dashboard.classList.remove("hidden")

document.getElementById("operatorInfo").innerText =
"Operador: " + matricula


/* BUSCAR LIGAÇÕES DO DIA */

if(window.buscarLigacoes){

const ligacoes = await buscarLigacoes(matricula)

history = []

ligacoes.forEach(l => history.push(l))

history.sort((a,b)=>b.timestamp-a.timestamp)

renderHistory()

}

}


/* HISTÓRICO */

function renderHistory(){

historyList.innerHTML=""

history.forEach(item=>{

const div=document.createElement("div")

div.className="history-item"

div.innerHTML=
`<strong>${item.result}</strong>
${item.reason?" • "+item.reason:""}
<br><small>${item.duration} • ${item.date} ${item.time}</small>`

historyList.appendChild(div)

})

updateStats()

}


/* MINI PAINEL */

function updateStats(){

let atendidas = history.length

let canceladas = history.filter(
item => item.result === "Cancelado"
).length

let taxa = 0

if(atendidas > 0){

taxa = (canceladas / atendidas) * 100

}

const totalEl = document.getElementById("statTotal")
const rateEl = document.getElementById("statRate")

if(totalEl){
totalEl.textContent = "Atendidas: " + atendidas
}

if(rateEl){
rateEl.textContent = "Taxa de desc.: " + taxa.toFixed(1) + "%"
}

}


/* SALVAR HISTÓRICO */

function addToHistory(duration,result,reason){

const now = new Date()

const data = {

date: now.toLocaleDateString(),
time: now.toLocaleTimeString(),
duration: duration,
result: result,
reason: reason,
timestamp: now.getTime(),
operator: matricula

}

history.unshift(data)

renderHistory()

if(window.salvarAtendimento){

salvarAtendimento(matricula,data)

}

}


/* TIMER */

function formatTime(sec){

const min=String(Math.floor(sec/60)).padStart(2,"0")
const s=String(sec%60).padStart(2,"0")

return `${min}:${s}`

}


/* CONFIRMAR */

function confirmAction(btn,callback){

if(btn.classList.contains("confirming")){

callback()
return

}

const original=btn.textContent

btn.textContent="Confirmar"

btn.classList.add("confirming")

setTimeout(()=>{

btn.classList.remove("confirming")
btn.textContent=original

},2000)

}


/* ABRIR PAINEL */

async function openFloatingPanel(){

if(!("documentPictureInPicture" in window)){

alert("Sem suporte.")
return

}

if(pipWindow && !pipWindow.closed) return


pipWindow=await window.documentPictureInPicture.requestWindow({

width:320,
height:360

})


pipWindow.document.body.innerHTML=`

<style>

body{
font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
background:white;
margin:0;
padding:16px;
display:flex;
flex-direction:column;
gap:12px;
}

.timer{
font-size:28px;
font-weight:600;
}

button{
padding:12px;
border-radius:10px;
border:none;
cursor:pointer;
font-size:14px;
width:100%;
}

.primary{background:#2563eb;color:white;}
.danger{background:#ef4444;color:white;}

.row{display:flex;gap:8px;}
.row button{flex:1;}

select{
width:100%;
padding:10px;
border-radius:8px;
border:1px solid #ddd;
}

.hidden{display:none;}

</style>

<h3 id="statusTitle">Disponível</h3>

<div id="timer" class="timer hidden">00:00</div>

<button id="startBtn" class="primary">Atender</button>

<button id="endBtn" class="danger hidden">Encerrar</button>

<div id="resultArea" class="hidden">

<div class="row">
<button id="retidoBtn" class="primary">Retido</button>
<button id="canceladoBtn" class="danger">Cancelado</button>
</div>

<select id="reasonSelect" class="hidden">

<option value="">Selecione o motivo</option>
<option>Atendimento</option>
<option>Produto</option>
<option>Técnico</option>
<option>Mudança de endereço</option>
<option>021</option>

</select>

<button id="confirmBtn" class="primary hidden">
Concluir
</button>

</div>

`

bindPanel()

}


/* BIND */

function bindPanel(){

const doc=pipWindow.document

const statusTitle=doc.getElementById("statusTitle")
const timer=doc.getElementById("timer")

const startBtn=doc.getElementById("startBtn")
const endBtn=doc.getElementById("endBtn")

const resultArea=doc.getElementById("resultArea")

const retidoBtn=doc.getElementById("retidoBtn")
const canceladoBtn=doc.getElementById("canceladoBtn")

const reasonSelect=doc.getElementById("reasonSelect")
const confirmBtn=doc.getElementById("confirmBtn")


startBtn.onclick=()=>{

seconds=0

statusTitle.textContent="Em atendimento"

startBtn.classList.add("hidden")
timer.classList.remove("hidden")
endBtn.classList.remove("hidden")

callInterval=setInterval(()=>{

seconds++
timer.textContent=formatTime(seconds)

},1000)

}


endBtn.onclick=()=>{

clearInterval(callInterval)

statusTitle.textContent="Finalizar"

endBtn.classList.add("hidden")

resultArea.classList.remove("hidden")

}


retidoBtn.onclick=()=>{

selectedResult="Retido"

reasonSelect.classList.add("hidden")

confirmAction(retidoBtn,()=>{

addToHistory(
formatTime(seconds),
"Retido",
""
)

resetPanel()

})

}


canceladoBtn.onclick=()=>{

selectedResult="Cancelado"

reasonSelect.classList.remove("hidden")
confirmBtn.classList.remove("hidden")

}


confirmBtn.onclick=()=>{

if(!reasonSelect.value)return

confirmAction(confirmBtn,()=>{

addToHistory(
formatTime(seconds),
"Cancelado",
reasonSelect.value
)

resetPanel()

})

}

}


/* RESET */

function resetPanel(){

clearInterval(callInterval)

const doc=pipWindow.document

seconds=0
selectedResult=null

doc.getElementById("statusTitle").textContent="Disponível"
doc.getElementById("timer").textContent="00:00"

doc.getElementById("timer").classList.add("hidden")
doc.getElementById("endBtn").classList.add("hidden")
doc.getElementById("resultArea").classList.add("hidden")

doc.getElementById("reasonSelect").classList.add("hidden")
doc.getElementById("confirmBtn").classList.add("hidden")

doc.getElementById("startBtn").classList.remove("hidden")

}


/* AUTO PIP */

document.addEventListener("visibilitychange",()=>{

if(document.visibilityState==="hidden"){

openFloatingPanel()

}

})