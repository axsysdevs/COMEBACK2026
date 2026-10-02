const defaultHabits=[
  {id:"wake",name:"Wake up at 05:00",emoji:"⏰",xp:15},
  {id:"gym",name:"Gym",emoji:"💪",xp:20},
  {id:"learn",name:"Reading / Learning",emoji:"📖",xp:20},
  {id:"plan",name:"Day Planning",emoji:"📅",xp:10},
  {id:"nogoon",name:"No Goofing",emoji:"💨",xp:15},
  {id:"work",name:"Project Work",emoji:"🎯",xp:25}
];

let state=JSON.parse(localStorage.getItem("lifeQuest"))||{
  habits:defaultHabits,checks:{},mood:7,sleep:8,name:"Player One"
};
let viewDate=new Date();

const $=s=>document.querySelector(s);
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const todayKey=dateKey(new Date());
function save(){localStorage.setItem("lifeQuest",JSON.stringify(state))}
function checksFor(key){return state.checks[key]||{}}
function isDone(day,id){return !!checksFor(day)[id]}
function toggle(day,id){
  if(!state.checks[day]) state.checks[day]={};
  state.checks[day][id]=!state.checks[day][id];
  save(); renderAll();
}
function score(day){
  if(!state.habits.length)return 0;
  return Math.round(state.habits.filter(h=>isDone(day,h.id)).length/state.habits.length*100);
}
function xp(){
  let total=0;
  Object.entries(state.checks).forEach(([day,c])=>state.habits.forEach(h=>{if(c[h.id])total+=Number(h.xp)}));
  return total;
}
function streak(){
  let n=0,d=new Date();
  while(score(dateKey(d))===100){n++;d.setDate(d.getDate()-1)}
  return n;
}
function bestStreak(){
  let best=0,run=0,d=new Date();
  d.setDate(d.getDate()-365);
  for(let i=0;i<=365;i++){if(score(dateKey(d))===100)run++;else run=0;best=Math.max(best,run);d.setDate(d.getDate()+1)}
  return best;
}
function daysBack(n){let d=new Date();d.setDate(d.getDate()-n);return d}
function renderHabits(){
  $("#habitList").innerHTML=state.habits.map(h=>`
    <div class="habit-row">
      <button class="check ${isDone(todayKey,h.id)?"done":""}" onclick="toggle('${todayKey}','${h.id}')">${isDone(todayKey,h.id)?"✓":h.emoji}</button>
      <div class="habit-name ${isDone(todayKey,h.id)?"done":""}">${h.name}</div>
      <div class="xp">+${h.xp} XP</div>
    </div>`).join("");
}
function renderBars(){
  const days=[...Array(7)].map((_,i)=>daysBack(6-i));
  $("#barChart").innerHTML=days.map(d=>`<div class="bar ${score(dateKey(d))===0?"zero":""}" style="height:${Math.max(4,score(dateKey(d))*.82)}%"></div>`).join("");
  $("#chartLabels").innerHTML=days.map(d=>`<span>${d.toLocaleDateString("en",{weekday:"short"})}</span>`).join("");
}
function renderCalendar(){
  const y=viewDate.getFullYear(),m=viewDate.getMonth(),days=new Date(y,m+1,0).getDate();
  $("#monthTitle").textContent=viewDate.toLocaleDateString("en",{month:"long",year:"numeric"});
  let out=`<div class="cal-cell cal-head cal-name">Habit</div>`;
  for(let d=1;d<=31;d++)out+=`<div class="cal-cell cal-head">${d<=days?d:""}</div>`;
  state.habits.forEach(h=>{
    out+=`<div class="cal-cell cal-name">${h.emoji} &nbsp;${h.name}</div>`;
    for(let d=1;d<=31;d++){
      if(d>days){out+=`<div class="cal-cell"></div>`;continue}
      const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      out+=`<div class="cal-cell"><button class="cal-check ${isDone(key,h.id)?"done":""}" onclick="toggle('${key}','${h.id}')"></button></div>`;
    }
  });
  $("#calendar").innerHTML=out;
}
function renderStats(){
  const s=streak(), x=xp(), level=Math.floor(x/100)+1, inLevel=x%100;
  $("#currentStreak").textContent=s;$("#bestStreak").textContent=bestStreak();$("#totalXp").textContent=x;
  $("#level").textContent=level;$("#xpText").textContent=`${inLevel} / 100 XP`;$("#xpBar").style.width=inLevel+"%";
  const today=score(todayKey);$("#todayScore").textContent=today+"%";$("#todayDone").textContent=`${state.habits.filter(h=>isDone(todayKey,h.id)).length} / ${state.habits.length} completed`;
  $("#streakPill").textContent=`${s} day streak`;
  const vals=[...Array(7)].map((_,i)=>score(dateKey(daysBack(6-i))));
  const avg=Math.round(vals.reduce((a,b)=>a+b,0)/7);
  $("#completionRate").textContent=avg+"%";$("#completionLine").style.width=avg+"%";
  $("#perfectDays").textContent=vals.filter(v=>v===100).length;
  $("#bigChart").innerHTML=vals.map(v=>`<div class="big-bar" style="height:${Math.max(2,v*.82)}%"><span>${v}%</span></div>`).join("");
  $("#mood").value=state.mood;$("#moodValue").textContent=state.mood+"/10";$("#sleep").value=state.sleep;
  $("#dateLabel").textContent=new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}
function renderManager(){
  $("#habitManager").innerHTML=state.habits.map(h=>`
    <div class="manager-row">
      <div class="manager-name">${h.emoji} ${h.name}</div>
      <div class="muted">${h.xp} XP</div>
      <div class="muted">Daily</div>
      <div class="manager-actions"><button class="small-btn" onclick="editHabit('${h.id}')">Edit</button><button class="delete" onclick="deleteHabit('${h.id}')">Delete</button></div>
    </div>`).join("");
}
function renderAll(){renderHabits();renderBars();renderCalendar();renderStats();renderManager();$("#displayName").value=state.name}
function openHabit(id=null){
  $("#habitDialog").showModal();$("#habitId").value=id||"";
  const h=state.habits.find(x=>x.id===id);
  $("#dialogTitle").textContent=h?"Edit Habit":"Add Habit";
  $("#habitName").value=h?h.name:"";$("#habitEmoji").value=h?h.emoji:"✓";$("#habitXp").value=h?h.xp:15;
}
window.editHabit=openHabit;
window.deleteHabit=id=>{if(confirm("Delete this habit?")){state.habits=state.habits.filter(h=>h.id!==id);save();renderAll()}};
document.querySelectorAll(".nav").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active-view"));$("#"+btn.dataset.view).classList.add("active-view");
  $("#pageTitle").textContent={dashboard:"Daily Dashboard",habits:"Habit Manager",stats:"Progress & Wellness",settings:"Settings"}[btn.dataset.view];
});
$("#addHabitBtn").onclick=()=>openHabit();$("#addHabitBtn2").onclick=()=>openHabit();
$("#habitForm").addEventListener("submit",e=>{
  e.preventDefault();const id=$("#habitId").value||("h"+Date.now());
  const item={id,name:$("#habitName").value.trim(),emoji:$("#habitEmoji").value||"✓",xp:Number($("#habitXp").value)||10};
  const idx=state.habits.findIndex(h=>h.id===id);if(idx>=0)state.habits[idx]=item;else state.habits.push(item);
  save();$("#habitDialog").close();renderAll();
});
$("#prevMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()-1);renderCalendar()};
$("#nextMonth").onclick=()=>{viewDate.setMonth(viewDate.getMonth()+1);renderCalendar()};
$("#todayBtn").onclick=()=>{viewDate=new Date();renderAll()};
$("#mood").oninput=e=>{state.mood=e.target.value;$("#moodValue").textContent=e.target.value+"/10";save()};
$("#sleep").onchange=e=>{state.sleep=e.target.value;save()};
$("#displayName").onchange=e=>{state.name=e.target.value;save()};
$("#resetBtn").onclick=()=>{if(confirm("Reset all habits and progress?")){localStorage.removeItem("lifeQuest");location.reload()}};
renderAll();
