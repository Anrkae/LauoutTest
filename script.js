let pipWindow=null
let callInterval=null
let seconds=0

let selectedResult=null
let history=[]


/* LOGIN */

function login(){

loginScreen.classList.add("hidden")
dashboard.classList.remove("hidden")

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
<br><small>${item.duration} • ${item.date}</small>`

historyList.appendChild(div)

})

}


function addToHistory(duration,result,reason){

history.unshift({

date:new Date().toLocaleString(),
duration,
result,
reason

})

renderHistory()

}


/* TIMER */

function formatTime(sec){

const min=String(Math.floor(sec/60)).padStart(2,"0")
const s=String(sec%60).padStart(2,"0")

return `${min}:${s}`

}


/* CONFIRMAÇÃO DINÂMICA */

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


/* FLOAT PANEL */

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
margin-top:4px;
position:relative;
overflow:hidden;
}

.primary{background:#2563eb;color:white;}
.danger{background:#ef4444;color:white;}

.row{display:flex;gap:8px;margin-top:6px;}
.row button{flex:1;}

select{
width:100%;
padding:10px;
border-radius:8px;
border:1px solid #ddd;
margin-top:6px;
}

.hidden{display:none;}

.confirming::before{
content:"";
position:absolute;
top:0;
left:0;
height:100%;
width:100%;
background:rgba(0, 0, 0, 0.1);
animation:loadbar 2s linear forwards;
}

@keyframes loadbar{
from{width:0%}
to{width:100%}
}

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


/* ATENDER */

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


/* ENCERRAR */

endBtn.onclick=()=>{

clearInterval(callInterval)

statusTitle.textContent="Finalizar"

endBtn.classList.add("hidden")

resultArea.classList.remove("hidden")

}


/* RETIDO */

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


/* CANCELADO */

canceladoBtn.onclick=()=>{

selectedResult="Cancelado"

reasonSelect.classList.remove("hidden")
confirmBtn.classList.remove("hidden")

}


/* CONCLUIR */

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