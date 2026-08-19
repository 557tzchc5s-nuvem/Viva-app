(() => {
  'use strict';

  const STORAGE_KEY = 'viva-v1-state';
  const DAILY_SECTIONS = ['agenda', 'treino', 'dieta', 'trabalho'];
  const COLORS = { agenda:'#7657ff', financeiro:'#48c998', treino:'#ff8a34', dieta:'#ffd84d', trabalho:'#42a5ff' };
  const LABELS = { agenda:'Agenda pessoal', financeiro:'Finanças', treino:'Treino', dieta:'Dieta', trabalho:'Trabalho' };
  const PLACEHOLDERS = {
    agenda:'09:00 Dentista\n14:00-16:00 Compromisso\n\nToque e escreva. O app salva sozinho.',
    treino:'19:00 Academia\n\nTreino de hoje\nSupino 3x10\nAgachamento 3x8',
    dieta:'08:00 Café da manhã\n12:30 Almoço\n19:30 Jantar\n\nAnote o que comeu, sem burocracia.',
    trabalho:'10:00 Responder clientes\n14:00-18:00 Projeto principal\n\nPrioridades\n• ...'
  };

  const REFLECTIONS = [
    ['Nem tudo depende de você. Sua resposta, sim.', 'O que merece sua energia hoje — e o que pode ser solto?'],
    ['O dia fica mais leve quando você para de discutir com o inevitável.', 'Existe algo que você está tentando controlar sem poder?'],
    ['Disciplina é escolher de novo, mesmo quando a vontade muda.', 'Qual pequena ação de hoje aproxima você de quem quer ser?'],
    ['Você não precisa vencer o dia inteiro. Precisa cuidar bem do próximo passo.', 'Qual é o próximo passo realmente necessário?'],
    ['O tempo não pede licença para passar. Use o que está em suas mãos.', 'Que parte deste dia você não quer entregar ao automático?'],
    ['A opinião dos outros pesa menos quando seus valores estão claros.', 'Qual valor deve orientar sua decisão mais importante de hoje?'],
    ['Conforto é agradável; direção é melhor.', 'Onde um pouco de desconforto pode gerar crescimento hoje?'],
    ['Antes de reagir, escolha quem você quer ser naquela situação.', 'Que resposta deixaria você em paz consigo mesmo depois?'],
    ['Ter menos urgências começa por distinguir o importante do barulho.', 'O que parece urgente, mas não é importante?'],
    ['Você não controla o vento, mas pode ajustar a maneira de navegar.', 'Que ajuste simples está ao seu alcance agora?'],
    ['Um dia difícil ainda pode ser um dia bem vivido.', 'O que faria este dia valer a pena, mesmo sem ser perfeito?'],
    ['A constância não exige intensidade máxima. Exige retorno.', 'Se você falhou ontem, qual é a menor forma de voltar hoje?'],
    ['Aquilo que você alimenta com atenção ganha espaço dentro de você.', 'O que merece mais atenção — e o que merece menos?'],
    ['Não transforme um problema de uma hora em sofrimento de um dia inteiro.', 'Você está carregando algo além do tempo necessário?'],
    ['O futuro é construído com decisões que parecem pequenas no presente.', 'Qual escolha pequena você agradecerá por ter feito daqui a um mês?'],
    ['A calma também pode ser uma forma de força.', 'Onde responder devagar seria mais poderoso do que reagir rápido?'],
    ['Não espere sentir vontade para agir de acordo com seus princípios.', 'O que você sabe que precisa fazer independentemente da motivação?'],
    ['Comparação rouba atenção da única vida que você pode realmente conduzir: a sua.', 'Qual progresso seu merece ser reconhecido hoje?'],
    ['Aceitar a realidade não significa gostar dela. Significa começar do ponto verdadeiro.', 'Qual verdade você precisa encarar para poder avançar?'],
    ['Você pode perder coisas externas sem perder seu caráter.', 'Que qualidade sua você quer preservar em qualquer circunstância?'],
    ['O excesso de planos também pode ser uma forma de adiar a ação.', 'Qual planejamento já está bom o bastante para começar?'],
    ['Poucas coisas bem feitas valem mais que muitas começadas.', 'O que merece ser concluído antes de você abrir outra frente?'],
    ['O presente é o único lugar onde sua vontade consegue agir.', 'Que ação cabe nos próximos dez minutos?'],
    ['Nem toda provocação merece uma resposta.', 'O que você pode escolher não alimentar hoje?'],
    ['Se você quer liberdade, reduza a dependência daquilo que não controla.', 'De que aprovação ou resultado externo você está dependendo demais?'],
    ['A forma como você usa uma dificuldade pode ser mais importante que a dificuldade em si.', 'O que esta situação pode treinar em você?'],
    ['Descansar com intenção não é abandonar o caminho.', 'Seu corpo ou sua mente estão pedindo recuperação verdadeira?'],
    ['Seu padrão aparece mais nos dias comuns do que nos dias extraordinários.', 'Que hábito simples define a pessoa que você está construindo?'],
    ['Não desperdice duas dores: a do fato e a da história que você inventa sobre ele.', 'Qual parte do seu sofrimento é fato e qual parte é interpretação?'],
    ['Coragem não elimina o medo; ela decide apesar dele.', 'Que decisão você adiou apenas por desconforto?'],
    ['Memento vivere: lembrar da finitude é um convite para estar presente.', 'Se este dia não voltasse, o que mereceria mais presença sua?']
  ];

  const defaults = {
    goals: [
      { id:'g-bed', text:'Arrumar a cama' },
      { id:'g-training', text:'Dedicar 1h ou mais para treino' },
      { id:'g-self', text:'15 min para você' }
    ],
    goalChecks:{},
    notes:{ agenda:{}, treino:{}, dieta:{}, trabalho:{} },
    finance:{},
    reflectionHistory:{},
    lastReflectionShown:null
  };

  let state = loadState();
  let currentSection = 'home';
  let activeDailySection = 'agenda';
  let currentDate = new Date();
  let currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  let reflectionReturnSection = 'home';
  let saveTimer = null;

  const $ = id => document.getElementById(id);
  const paper = $('paper');
  const dailyNotes = $('dailyNotes');
  const financeNotes = $('financeNotes');

  init();

  function init() {
    bindNavigation(); bindInputs(); bindPageGestures(); renderAll(); registerServiceWorker();
    setTimeout(showDailyReflectionIfNeeded, 420);
  }

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function loadState(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(defaults);
      const saved = JSON.parse(raw);
      return {
        ...clone(defaults), ...saved,
        goals: Array.isArray(saved.goals) && saved.goals.length ? saved.goals : clone(defaults.goals),
        goalChecks: saved.goalChecks || {},
        notes: { ...clone(defaults.notes), ...(saved.notes || {}) },
        finance: saved.finance || {},
        reflectionHistory: saved.reflectionHistory || {}
      };
    } catch (err) {
      console.warn('Não foi possível ler os dados salvos.', err);
      return clone(defaults);
    }
  }

  function saveState(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), 90);
  }

  function isoDate(date){
    const y=date.getFullYear(), m=String(date.getMonth()+1).padStart(2,'0'), d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function monthKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
  function formatDate(date, options={}) {
    return new Intl.DateTimeFormat('pt-BR', { weekday:'long', day:'numeric', month:'long', ...options }).format(date);
  }
  function formatShortDate(date){ return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(date).replace('.',''); }
  function sameDay(a,b){ return isoDate(a)===isoDate(b); }
  function addDays(date,n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
  function addMonths(date,n){ return new Date(date.getFullYear(), date.getMonth()+n, 1); }

  function bindNavigation(){
    document.querySelectorAll('[data-section]').forEach(el => el.addEventListener('click', () => showSection(el.dataset.section)));
    $('reflectionShortcut').addEventListener('click', showReflections);
    $('todayReflectionCard').addEventListener('click', () => openReflection(todayReflection()));
    $('closeReflection').addEventListener('click', closeReflectionModal);
    $('backFromReflections').addEventListener('click', () => showSection(reflectionReturnSection));
    $('prevPageBtn').addEventListener('click', () => turnDailyPage(-1));
    $('nextPageBtn').addEventListener('click', () => turnDailyPage(1));
    $('prevMonthBtn').addEventListener('click', () => turnFinancePage(-1));
    $('nextMonthBtn').addEventListener('click', () => turnFinancePage(1));
    $('addGoalBtn').addEventListener('click', addGoal);
  }

  function showSection(section){
    if (section==='home') currentSection='home';
    else if (DAILY_SECTIONS.includes(section)) { currentSection=section; activeDailySection=section; }
    else if (section==='financeiro') currentSection='financeiro';
    else return;

    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active-section'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.section===currentSection));
    if (currentSection==='home') $('homeSection').classList.add('active-section');
    else if (currentSection==='financeiro') $('financeSection').classList.add('active-section');
    else $('dailySection').classList.add('active-section');
    renderAll();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function showReflections(){
    reflectionReturnSection=currentSection; currentSection='reflections';
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active-section'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    $('reflectionsSection').classList.add('active-section');
    renderReflectionHistory();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function bindInputs(){
    dailyNotes.addEventListener('input', () => {
      const key=isoDate(currentDate);
      if (!state.notes[activeDailySection]) state.notes[activeDailySection]={};
      state.notes[activeDailySection][key]=dailyNotes.value;
      saveState(); updatePlaceholder(); renderTimeline($('sharedTimeline'),currentDate);
      if (sameDay(currentDate,new Date())) { renderTimeline($('homeTimeline'),new Date()); renderHomeEvents(); }
    });

    financeNotes.addEventListener('input', () => {
      state.finance[monthKey(currentMonth)]=financeNotes.value;
      saveState(); renderFinanceBalance(); updateFinancePlaceholder();
    });
  }

  function renderAll(){
    $('topDate').textContent=formatShortDate(new Date());
    renderGoals(); renderDailyPage(); renderFinancePage();
    renderTimeline($('homeTimeline'),new Date()); renderHomeEvents();
    $('reflectionPreview').textContent=todayReflection().text;
  }

  function renderGoals(){
    const dayKey=isoDate(new Date()), checks=state.goalChecks[dayKey]||{}, list=$('goalsList');
    list.innerHTML='';
    state.goals.forEach(goal=>{
      const row=document.createElement('div'); row.className='goal-row';
      const check=document.createElement('button');
      check.className='goal-check'+(checks[goal.id]?' checked':''); check.type='button';
      check.setAttribute('aria-label',checks[goal.id]?'Desmarcar meta':'Marcar meta');
      check.addEventListener('click',()=>{
        if(!state.goalChecks[dayKey]) state.goalChecks[dayKey]={};
        state.goalChecks[dayKey][goal.id]=!state.goalChecks[dayKey][goal.id];
        saveState(); renderGoals();
      });
      const input=document.createElement('input');
      input.className='goal-input'+(checks[goal.id]?' done':''); input.value=goal.text; input.type='text'; input.autocomplete='off';
      input.setAttribute('aria-label','Texto da meta');
      input.addEventListener('input',()=>{ goal.text=input.value; saveState(); });
      input.addEventListener('blur',()=>{
        if(!goal.text.trim() && state.goals.length>1){
          state.goals=state.goals.filter(g=>g.id!==goal.id);
          Object.values(state.goalChecks).forEach(day=>{ if(day) delete day[goal.id]; });
          saveState(); renderGoals();
        }
      });
      row.append(check,input); list.appendChild(row);
    });
    const total=state.goals.filter(g=>g.text.trim()).length;
    const completed=state.goals.filter(g=>g.text.trim() && checks[g.id]).length;
    $('goalCount').textContent=`${completed}/${total}`;
    $('goalProgress').style.width=total?`${(completed/total)*100}%`:'0%';
    $('addGoalBtn').style.display=state.goals.length>=5?'none':'inline-block';
  }

  function addGoal(){
    if(state.goals.length>=5) return;
    state.goals.push({id:`g-${Date.now().toString(36)}`,text:''}); saveState(); renderGoals();
    requestAnimationFrame(()=>{ const inputs=document.querySelectorAll('.goal-input'); inputs[inputs.length-1]?.focus(); });
  }

  function renderDailyPage(){
    if(!DAILY_SECTIONS.includes(activeDailySection)) return;
    const key=isoDate(currentDate);
    $('sectionEyebrow').textContent=LABELS[activeDailySection];
    $('pageTitle').textContent=formatDate(currentDate);
    dailyNotes.value=state.notes[activeDailySection]?.[key]||'';
    $('dailyPlaceholder').textContent=PLACEHOLDERS[activeDailySection];
    $('dailyPageNumber').textContent=`${formatShortDate(currentDate)} · ${sameDay(currentDate,new Date())?'hoje':'página diária'}`;
    updatePlaceholder(); renderTimeline($('sharedTimeline'),currentDate);
  }
  function updatePlaceholder(){ $('dailyPlaceholder').style.display=dailyNotes.value?'none':'block'; }

  function renderFinancePage(){
    const key=monthKey(currentMonth);
    $('financeTitle').textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(currentMonth);
    financeNotes.value=state.finance[key]||'';
    $('financePageNumber').textContent=`página mensal · ${key}`;
    updateFinancePlaceholder(); renderFinanceBalance();
  }
  function updateFinancePlaceholder(){ document.querySelector('.finance-page .page-placeholder').style.display=financeNotes.value?'none':'block'; }
  function renderFinanceBalance(){
    $('financeBalance').textContent=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFinance(financeNotes.value));
  }
  function parseFinance(text){
    return text.split('\n').reduce((sum,line)=>{
      const match=line.trim().match(/^([+-])\s*(?:R\$\s*)?([\d.]+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/i);
      if(!match) return sum;
      let raw=match[2];
      if(raw.includes(',')) raw=raw.replace(/\./g,'').replace(',','.');
      const amount=Number(raw);
      return Number.isFinite(amount) ? sum+(match[1]==='-'?-amount:amount) : sum;
    },0);
  }

  function turnDailyPage(direction){ if(!DAILY_SECTIONS.includes(activeDailySection))return; animateFlip(direction); currentDate=addDays(currentDate,direction); renderDailyPage(); }
  function turnFinancePage(direction){ animateFlip(direction); currentMonth=addMonths(currentMonth,direction); renderFinancePage(); }
  function animateFlip(direction){
    const cls=direction>0?'flip-next':'flip-prev';
    paper.classList.remove('flip-next','flip-prev'); void paper.offsetWidth; paper.classList.add(cls);
    setTimeout(()=>paper.classList.remove(cls),300);
  }

  function parseEventsForDate(date){
    const key=isoDate(date), events=[];
    DAILY_SECTIONS.forEach(section=>{
      const text=state.notes[section]?.[key]||'';
      text.split('\n').forEach(line=>{ const parsed=parseTimedLine(line); if(parsed) events.push({...parsed,section,color:COLORS[section]}); });
    });
    return events.sort((a,b)=>a.start-b.start);
  }

  function parseTimedLine(line){
    const clean=line.trim();
    const range=clean.match(/^(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)?\s*(?:-|–|até)\s*(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)?\s+(.+)$/i);
    if(range){
      const sh=Number(range[1]), sm=Number(range[2]??range[3]??0), eh=Number(range[4]), em=Number(range[5]??range[6]??0);
      if(validTime(sh,sm)&&validTime(eh,em)){
        const start=sh+sm/60; let end=eh+em/60; if(end<=start) end=start+1;
        return {start,end,label:range[7].trim(),time:`${pad2(sh)}:${pad2(sm)}–${pad2(eh)}:${pad2(em)}`};
      }
    }
    const single=clean.match(/^(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)\s+(.+)$/i);
    if(single){
      const h=Number(single[1]),m=Number(single[2]??single[3]??0);
      if(validTime(h,m)){ const start=h+m/60; return {start,end:start+1,label:single[4].trim(),time:`${pad2(h)}:${pad2(m)}`}; }
    }
    return null;
  }
  function validTime(h,m){ return h>=0&&h<=23&&m>=0&&m<=59; }
  function pad2(n){ return String(n).padStart(2,'0'); }

  function renderTimeline(container,date){
    if(!container)return;
    const startHour=6,endHour=24,span=endHour-startHour;
    container.innerHTML='';
    const grid=document.createElement('div'); grid.className='timeline-grid';
    for(let i=0;i<span;i++) grid.appendChild(document.createElement('span'));
    container.appendChild(grid);
    parseEventsForDate(date).forEach(event=>{
      const visibleStart=Math.max(event.start,startHour),visibleEnd=Math.min(event.end,endHour);
      if(visibleEnd<=startHour||visibleStart>=endHour)return;
      const block=document.createElement('div'); block.className='timeline-event';
      block.style.left=`${((visibleStart-startHour)/span)*100}%`;
      block.style.width=`${((visibleEnd-visibleStart)/span)*100}%`;
      block.style.background=event.color; block.title=`${event.time} ${event.label}`;
      container.appendChild(block);
    });
    const labels=document.createElement('div'); labels.className='timeline-labels';
    labels.innerHTML='<span>06</span><span>12</span><span>18</span><span>24</span>';
    container.appendChild(labels);
  }

  function renderHomeEvents(){
    const root=$('homeEvents'),events=parseEventsForDate(new Date()); root.innerHTML='';
    if(!events.length){
      const empty=document.createElement('div'); empty.className='home-event';
      empty.innerHTML='<span class="home-event-dot" style="background:#cfc8d5"></span><div><strong>Dia aberto</strong><span>Seus horários aparecem aqui ao escrevê-los nas páginas.</span></div>';
      root.appendChild(empty); return;
    }
    events.slice(0,6).forEach(event=>{
      const row=document.createElement('div'); row.className='home-event';
      const dot=document.createElement('span'); dot.className='home-event-dot'; dot.style.background=event.color;
      const text=document.createElement('div'),strong=document.createElement('strong'),sub=document.createElement('span');
      strong.textContent=`${event.time} · ${event.label}`; sub.textContent=LABELS[event.section];
      text.append(strong,sub); row.append(dot,text); root.appendChild(row);
    });
  }

  function dayOfYear(date){ const start=new Date(date.getFullYear(),0,0); return Math.floor((date-start)/86400000); }
  function reflectionForDate(date){
    const idx=(dayOfYear(date)+date.getFullYear())%REFLECTIONS.length;
    const [text,prompt]=REFLECTIONS[idx];
    return {key:isoDate(date),date:new Date(date),text,prompt};
  }
  function todayReflection(){ return reflectionForDate(new Date()); }
  function archiveReflection(reflection){
    state.reflectionHistory[reflection.key]={text:reflection.text,prompt:reflection.prompt}; saveState();
  }
  function showDailyReflectionIfNeeded(){
    const today=todayReflection(); archiveReflection(today);
    if(state.lastReflectionShown!==today.key){
      state.lastReflectionShown=today.key; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); openReflection(today);
    }
  }
  function openReflection(reflection){
    archiveReflection(reflection);
    $('reflectionDate').textContent=formatDate(reflection.date);
    $('reflectionText').textContent=reflection.text;
    $('reflectionPrompt').textContent=reflection.prompt;
    $('reflectionModal').classList.add('open'); $('reflectionModal').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeReflectionModal(){
    $('reflectionModal').classList.remove('open'); $('reflectionModal').setAttribute('aria-hidden','true'); document.body.style.overflow='';
  }
  function renderReflectionHistory(){
    const root=$('reflectionHistory'); root.innerHTML='';
    const entries=Object.entries(state.reflectionHistory).sort((a,b)=>b[0].localeCompare(a[0]));
    if(!entries.length){ root.innerHTML='<div class="empty-history">As reflexões dos dias em que você abrir o VIVA aparecerão aqui.</div>'; return; }
    entries.forEach(([key,item])=>{
      const date=new Date(`${key}T12:00:00`),btn=document.createElement('button'),time=document.createElement('time'),strong=document.createElement('strong');
      btn.className='history-item'; time.textContent=formatDate(date); strong.textContent=item.text; btn.append(time,strong);
      btn.addEventListener('click',()=>openReflection({key,date,text:item.text,prompt:item.prompt||''}));
      root.appendChild(btn);
    });
  }

  function bindPageGestures(){
    bindEdgeHold($('edgeLeft'),-1); bindEdgeHold($('edgeRight'),1);
    let startX=0,startY=0,tracking=false;
    paper.addEventListener('touchstart',e=>{
      if(currentSection==='home'||currentSection==='reflections')return;
      const t=e.target; if(t.closest('textarea, input, button, .edge-zone'))return;
      const touch=e.touches[0]; startX=touch.clientX; startY=touch.clientY; tracking=true;
    },{passive:true});
    paper.addEventListener('touchend',e=>{
      if(!tracking)return; tracking=false;
      const touch=e.changedTouches[0],dx=touch.clientX-startX,dy=touch.clientY-startY;
      if(Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.25)return;
      if(currentSection==='financeiro')turnFinancePage(dx<0?1:-1);
      else if(DAILY_SECTIONS.includes(currentSection))turnDailyPage(dx<0?1:-1);
    },{passive:true});
  }

  function bindEdgeHold(zone,direction){
    let holdTimer=null,repeatTimer=null,longPress=false;
    const clear=()=>{ clearTimeout(holdTimer); clearInterval(repeatTimer); holdTimer=null; repeatTimer=null; };
    zone.addEventListener('pointerdown',e=>{
      if(currentSection==='home'||currentSection==='reflections')return;
      e.preventDefault(); longPress=false;
      holdTimer=setTimeout(()=>{ longPress=true; turnCurrent(direction); repeatTimer=setInterval(()=>turnCurrent(direction),330); },520);
    });
    zone.addEventListener('pointerup',e=>{
      if(currentSection==='home'||currentSection==='reflections')return;
      e.preventDefault(); clear(); if(!longPress)turnCurrent(direction);
    });
    zone.addEventListener('pointercancel',clear); zone.addEventListener('pointerleave',clear);
  }
  function turnCurrent(direction){
    if(currentSection==='financeiro')turnFinancePage(direction);
    else if(DAILY_SECTIONS.includes(currentSection))turnDailyPage(direction);
  }

  function registerServiceWorker(){
    if('serviceWorker' in navigator){
      window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker não registrado:',err)));
    }
  }
})();