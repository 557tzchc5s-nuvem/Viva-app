(() => {
  'use strict';

  const STORAGE_KEY = 'viva-v1-state'; // Mantém os dados da V1.
  const DAILY_SECTIONS = ['treino', 'dieta', 'trabalho'];
  const STICKERS = ['agenda', 'financeiro', 'treino', 'dieta', 'trabalho'];

  const COLORS = {
    agenda:'#7657ff',
    financeiro:'#48c998',
    treino:'#ff8a34',
    dieta:'#ffd84d',
    trabalho:'#42a5ff'
  };

  const STICKER_COLORS = {
    agenda:'#a995ff',
    financeiro:'#70ddb5',
    treino:'#ff9e59',
    dieta:'#ffe270',
    trabalho:'#73bbff'
  };

  const LABELS = {
    agenda:'Agenda',
    financeiro:'Finanças',
    treino:'Treino',
    dieta:'Dieta',
    trabalho:'Trabalho'
  };

  const PLACEHOLDERS = {
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
    lastReflectionShown:null,
    theme:null,
    stickerOrder:[...STICKERS],
    seenStickerHint:false,
    agendaView:'day'
  };

  let state = loadState();
  let currentSection = 'home';
  let activeDailySection = 'treino';
  let currentDate = new Date();
  let currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  let agendaView = state.agendaView || 'day';
  let reflectionReturnSection = 'home';
  let saveTimer = null;
  let pageTurning = false;

  const $ = id => document.getElementById(id);
  const app = $('app');
  const paper = $('paper');
  const dailyNotes = $('dailyNotes');
  const agendaNotes = $('agendaNotes');
  const financeNotes = $('financeNotes');

  init();

  function init() {
    applyTheme(resolveTheme());
    bindNavigation();
    bindInputs();
    bindPageGestures();
    renderAll();
    registerServiceWorker();
    setTimeout(showDailyReflectionIfNeeded, 360);
  }

  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return clone(defaults);
      const saved = JSON.parse(raw);
      const order = Array.isArray(saved.stickerOrder) ? saved.stickerOrder.filter(x => STICKERS.includes(x)) : [];
      STICKERS.forEach(x => { if(!order.includes(x)) order.push(x); });

      return {
        ...clone(defaults),
        ...saved,
        goals:Array.isArray(saved.goals) && saved.goals.length ? saved.goals : clone(defaults.goals),
        goalChecks:saved.goalChecks || {},
        notes:{...clone(defaults.notes), ...(saved.notes || {})},
        finance:saved.finance || {},
        reflectionHistory:saved.reflectionHistory || {},
        stickerOrder:order
      };
    }catch(err){
      console.warn('Não foi possível ler os dados salvos.', err);
      return clone(defaults);
    }
  }

  function saveState(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 80);
  }

  function resolveTheme(){
    if(state.theme === 'light' || state.theme === 'dark') return state.theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme){
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    $('themeToggle').textContent = theme === 'dark' ? '☀' : '☾';
    $('themeToggle').setAttribute('aria-label', theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro');
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', theme === 'dark' ? '#0d0a11' : '#17131f');
    saveState();
  }

  function toggleTheme(){
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  function isoDate(date){
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  function monthKey(date){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  }

  function formatDate(date, options={}){
    return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long',...options}).format(date);
  }

  function formatShortDate(date){
    return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(date).replace('.','');
  }

  function titleCaseFirst(text){ return text ? text.charAt(0).toUpperCase()+text.slice(1) : text; }
  function sameDay(a,b){ return isoDate(a) === isoDate(b); }
  function addDays(date,n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
  function addMonths(date,n){ return new Date(date.getFullYear(),date.getMonth()+n,1); }

  function startOfWeek(date){
    const d=new Date(date);
    const day=(d.getDay()+6)%7;
    d.setHours(12,0,0,0);
    d.setDate(d.getDate()-day);
    return d;
  }

  function daysInMonthGrid(anchor){
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    const start = startOfWeek(first);
    return Array.from({length:42},(_,i)=>addDays(start,i));
  }

  function greetingForNow(){
    const h = new Date().getHours();
    if(h < 12) return 'Bom dia.';
    if(h < 18) return 'Boa tarde.';
    return 'Boa noite.';
  }

  function bindNavigation(){
    document.querySelectorAll('[data-section]').forEach(el => {
      el.addEventListener('click', () => showSection(el.dataset.section));
    });

    $('themeToggle').addEventListener('click', toggleTheme);
    $('reflectionShortcut').addEventListener('click', showReflections);
    $('closeReflection').addEventListener('click', () => closeReflectionModal(true));
    $('backFromReflections').addEventListener('click', () => showSection(reflectionReturnSection));

    $('prevPageBtn').addEventListener('click', () => turnDailyPage(-1));
    $('nextPageBtn').addEventListener('click', () => turnDailyPage(1));
    $('prevMonthBtn').addEventListener('click', () => turnFinancePage(-1));
    $('nextMonthBtn').addEventListener('click', () => turnFinancePage(1));
    $('addGoalBtn').addEventListener('click', addGoal);

    $('agendaPrevBtn').addEventListener('click', () => turnAgenda(-1));
    $('agendaNextBtn').addEventListener('click', () => turnAgenda(1));

    document.querySelectorAll('[data-agenda-view]').forEach(btn => {
      btn.addEventListener('click', () => setAgendaView(btn.dataset.agendaView));
    });
  }

  function renderStickerTabs(){
    const nav = $('stickerTabs');
    nav.innerHTML = '';
    state.stickerOrder.forEach(section => {
      const btn = document.createElement('button');
      btn.className = 'tab';
      btn.dataset.section = section;
      btn.textContent = LABELS[section];
      btn.classList.toggle('active', currentSection === section);
      btn.addEventListener('click', () => showSection(section));
      nav.appendChild(btn);
    });
  }

  function renderFloatingStickers(){
    const root = $('floatingStickers');
    root.innerHTML = '';

    state.stickerOrder.forEach((section,index) => {
      const btn = document.createElement('button');
      btn.className = 'floating-sticker';
      btn.dataset.section = section;
      btn.dataset.slot = String(index);
      btn.style.setProperty('--sticker', STICKER_COLORS[section]);
      btn.textContent = LABELS[section];
      bindFloatingSticker(btn);
      root.appendChild(btn);
    });
  }

  function bindFloatingSticker(btn){
    let timer=null, dragging=false, moved=false, pointerId=null, startX=0, startY=0;
    const stage=$('homeStage');

    const clearTimer=()=>{clearTimeout(timer);timer=null};

    const getSlotCenters=()=>{
      return [...document.querySelectorAll('#reorderSlots i')].map(el=>{
        const r=el.getBoundingClientRect();
        return {x:r.left+r.width/2,y:r.top+r.height/2};
      });
    };

    const enterReorder=()=>{
      dragging=true;
      btn.classList.add('longpress');
      stage.classList.add('reorder-mode');
      showToast('Arraste para outro canto');
      try{
        if(pointerId!==null) btn.setPointerCapture(pointerId);
      }catch(_){}
    };

    btn.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      e.preventDefault();

      pointerId=e.pointerId;
      startX=e.clientX;
      startY=e.clientY;
      moved=false;
      dragging=false;

      clearTimer();
      timer=setTimeout(enterReorder,420);
    },{passive:false});

    btn.addEventListener('pointermove',e=>{
      const dx=e.clientX-startX;
      const dy=e.clientY-startY;
      const distance=Math.hypot(dx,dy);

      if(distance>7)moved=true;

      if(!dragging){
        if(distance>18)clearTimer();
        return;
      }

      e.preventDefault();

      /* durante o arraste, segue o dedo em posição fixa visual */
      const stageRect=stage.getBoundingClientRect();
      btn.style.position='absolute';
      btn.style.left=`${e.clientX-stageRect.left-btn.offsetWidth/2}px`;
      btn.style.top=`${e.clientY-stageRect.top-btn.offsetHeight/2}px`;
      btn.style.right='auto';
      btn.style.bottom='auto';
      btn.style.transform='scale(1.10) rotate(0deg)';
    },{passive:false});

    const finish=e=>{
      clearTimer();

      if(dragging){
        e.preventDefault();

        const centers=getSlotCenters();
        let nearest=0,best=Infinity;

        centers.forEach((c,index)=>{
          const d=Math.hypot(e.clientX-c.x,e.clientY-c.y);
          if(d<best){best=d;nearest=index}
        });

        const section=btn.dataset.section;
        const from=state.stickerOrder.indexOf(section);

        if(from>=0 && nearest!==from){
          const next=[...state.stickerOrder];
          const displaced=next[nearest];
          next[nearest]=section;
          next[from]=displaced;
          state.stickerOrder=next;
          saveState();
          showToast('Posição salva');
        }else{
          showToast('Posição mantida');
        }

        stage.classList.remove('reorder-mode');
        renderFloatingStickers();
        renderStickerTabs();
      }else if(!moved){
        showSection(btn.dataset.section);
      }

      dragging=false;
      pointerId=null;
    };

    btn.addEventListener('pointerup',finish,{passive:false});
    btn.addEventListener('pointercancel',()=>{
      clearTimer();
      dragging=false;
      pointerId=null;
      stage.classList.remove('reorder-mode');
      renderFloatingStickers();
    });
  }

  function showSection(section){
    currentSection = section;
    app.classList.toggle('home-mode', section === 'home');

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));

    if(section === 'home'){
      $('homeSection').classList.add('active-section');
    }else if(section === 'agenda'){
      $('agendaSection').classList.add('active-section');
    }else if(section === 'financeiro'){
      $('financeSection').classList.add('active-section');
    }else if(DAILY_SECTIONS.includes(section)){
      activeDailySection = section;
      $('dailySection').classList.add('active-section');
    }else{
      return;
    }

    renderStickerTabs();
    renderAll();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function showReflections(){
    reflectionReturnSection = currentSection;
    currentSection = 'reflections';
    app.classList.remove('home-mode');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
    $('reflectionsSection').classList.add('active-section');
    renderStickerTabs();
    renderReflectionHistory();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function bindInputs(){
    dailyNotes.addEventListener('input', () => {
      const key = isoDate(currentDate);
      if(!state.notes[activeDailySection]) state.notes[activeDailySection] = {};
      state.notes[activeDailySection][key] = dailyNotes.value;
      saveState();
      updateDailyPlaceholder();
      refreshCurrentDateVisuals();
    });

    agendaNotes.addEventListener('input', () => {
      const key = isoDate(currentDate);
      if(!state.notes.agenda) state.notes.agenda = {};
      state.notes.agenda[key] = agendaNotes.value;
      saveState();
      updateAgendaPlaceholder();
      refreshCurrentDateVisuals();
    });

    financeNotes.addEventListener('input', () => {
      state.finance[monthKey(currentMonth)] = financeNotes.value;
      saveState();
      renderFinanceBalance();
      updateFinancePlaceholder();
    });
  }

  function refreshCurrentDateVisuals(){
    renderTimeline($('sharedTimeline'), currentDate);
    renderTimeline($('agendaTimeline'), currentDate);
    if(agendaView === 'week') renderWeek();
    if(agendaView === 'month') renderMonth();
  }

  function renderAll(){
    $('topDate').textContent = formatShortDate(new Date());
    $('dayGreeting').textContent = greetingForNow();

    renderStickerTabs();
    renderFloatingStickers();
    renderGoals();

    renderDailyPage();
    renderFinancePage();
    renderAgenda();

    maybeShowStickerHint();
  }

  function renderGoals(){
    const dayKey = isoDate(new Date());
    const checks = state.goalChecks[dayKey] || {};
    const list = $('goalsList');
    list.innerHTML = '';

    state.goals.forEach(goal => {
      const row = document.createElement('div');
      row.className = 'goal-row';

      const check = document.createElement('button');
      check.className = 'goal-check' + (checks[goal.id] ? ' checked' : '');
      check.type = 'button';
      check.setAttribute('aria-label', checks[goal.id] ? 'Desmarcar meta' : 'Marcar meta');
      check.addEventListener('click', () => {
        if(!state.goalChecks[dayKey]) state.goalChecks[dayKey] = {};
        state.goalChecks[dayKey][goal.id] = !state.goalChecks[dayKey][goal.id];
        saveState();
        renderGoals();
      });

      const input = document.createElement('input');
      input.className = 'goal-input' + (checks[goal.id] ? ' done' : '');
      input.value = goal.text;
      input.type = 'text';
      input.autocomplete = 'off';
      input.setAttribute('aria-label','Texto da meta');
      input.addEventListener('input', () => {
        goal.text = input.value;
        saveState();
      });
      input.addEventListener('blur', () => {
        if(!goal.text.trim() && state.goals.length > 1){
          state.goals = state.goals.filter(g => g.id !== goal.id);
          Object.values(state.goalChecks).forEach(day => { if(day) delete day[goal.id]; });
          saveState();
          renderGoals();
        }
      });

      row.append(check,input);
      list.appendChild(row);
    });

    const total = state.goals.filter(g => g.text.trim()).length;
    const completed = state.goals.filter(g => g.text.trim() && checks[g.id]).length;
    $('goalCount').textContent = `${completed}/${total}`;
    $('addGoalBtn').style.display = state.goals.length >= 5 ? 'none' : 'inline-block';
  }

  function addGoal(){
    if(state.goals.length >= 5) return;
    state.goals.push({id:`g-${Date.now().toString(36)}`,text:''});
    saveState();
    renderGoals();
    requestAnimationFrame(() => {
      const inputs = document.querySelectorAll('.goal-input');
      inputs[inputs.length-1]?.focus();
    });
  }

  function maybeShowStickerHint(){
    if(currentSection !== 'home' || state.seenStickerHint) return;
    const hint = $('stickerHint');
    hint.hidden = false;
    setTimeout(() => {
      hint.hidden = true;
      state.seenStickerHint = true;
      saveState();
    }, 4200);
  }

  function setAgendaView(view){
    agendaView = ['day','week','month'].includes(view) ? view : 'day';
    state.agendaView = agendaView;
    saveState();

    document.querySelectorAll('[data-agenda-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.agendaView === agendaView);
    });

    document.querySelectorAll('.agenda-view').forEach(v => v.classList.remove('active-agenda-view'));
    if(agendaView === 'day') $('agendaDayView').classList.add('active-agenda-view');
    if(agendaView === 'week') $('agendaWeekView').classList.add('active-agenda-view');
    if(agendaView === 'month') $('agendaMonthView').classList.add('active-agenda-view');

    renderAgenda();
  }

  function renderAgenda(){
    document.querySelectorAll('[data-agenda-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.agendaView === agendaView);
    });

    document.querySelectorAll('.agenda-view').forEach(v => v.classList.remove('active-agenda-view'));

    if(agendaView === 'day'){
      $('agendaDayView').classList.add('active-agenda-view');
      $('agendaTitle').textContent = titleCaseFirst(formatDate(currentDate));
      agendaNotes.value = state.notes.agenda?.[isoDate(currentDate)] || '';
      $('agendaPageNumber').textContent = `${formatShortDate(currentDate)} · ${sameDay(currentDate,new Date()) ? 'hoje' : 'página diária'}`;
      updateAgendaPlaceholder();
      renderTimeline($('agendaTimeline'), currentDate);
    }

    if(agendaView === 'week'){
      $('agendaWeekView').classList.add('active-agenda-view');
      const start = startOfWeek(currentDate);
      const end = addDays(start,6);
      $('agendaTitle').textContent = `${formatShortDate(start)} — ${formatShortDate(end)}`;
      renderWeek();
    }

    if(agendaView === 'month'){
      $('agendaMonthView').classList.add('active-agenda-view');
      $('agendaTitle').textContent = titleCaseFirst(new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(currentDate));
      renderMonth();
    }
  }

  function renderWeek(){
    const root = $('weekGrid');
    root.innerHTML = '';
    const start = startOfWeek(currentDate);

    for(let i=0;i<7;i++){
      const date = addDays(start,i);
      const events = parseEventsForDate(date);
      const card = document.createElement('button');
      card.className = 'week-day-card';
      if(sameDay(date,new Date())) card.classList.add('today');
      if(sameDay(date,currentDate)) card.classList.add('selected');

      const weekday = new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(date).replace('.','').toUpperCase();
      const time = document.createElement('time');
      time.textContent = weekday;
      const day = document.createElement('b');
      day.textContent = date.getDate();
      card.append(time,day);

      if(events.length){
        events.slice(0,4).forEach(event => {
          const row = document.createElement('div');
          row.className = 'week-event';
          const dot = document.createElement('i');
          dot.style.setProperty('--c',event.color);
          const label = document.createElement('span');
          label.textContent = `${event.time} ${event.label}`;
          row.append(dot,label);
          card.appendChild(row);
        });
        if(events.length > 4){
          const more = document.createElement('div');
          more.className = 'week-empty';
          more.textContent = `+${events.length-4} compromisso(s)`;
          card.appendChild(more);
        }
      }else{
        const empty = document.createElement('div');
        empty.className = 'week-empty';
        empty.textContent = 'Dia livre';
        card.appendChild(empty);
      }

      card.addEventListener('click', () => {
        currentDate = date;
        setAgendaView('day');
      });

      root.appendChild(card);
    }
  }

  function renderMonth(){
    const root = $('monthGrid');
    root.innerHTML = '';
    const anchorMonth = currentDate.getMonth();
    const dates = daysInMonthGrid(currentDate);

    dates.forEach(date => {
      const cell = document.createElement('button');
      cell.className = 'month-day';
      if(date.getMonth() !== anchorMonth) cell.classList.add('outside');
      if(sameDay(date,new Date())) cell.classList.add('today');
      if(sameDay(date,currentDate)) cell.classList.add('selected');

      const num = document.createElement('span');
      num.className = 'month-day-number';
      num.textContent = date.getDate();
      cell.appendChild(num);

      const events = parseEventsForDate(date);
      const categories = [...new Set(events.map(e => e.section))];
      if(categories.length){
        const dots = document.createElement('div');
        dots.className = 'month-dots';
        categories.slice(0,5).forEach(section => {
          const dot = document.createElement('i');
          dot.style.setProperty('--c', COLORS[section]);
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
      }

      cell.addEventListener('click', () => {
        currentDate = new Date(date);
        setAgendaView('day');
      });

      root.appendChild(cell);
    });
  }

  function turnAgenda(direction){
    if(agendaView === 'day'){
      animatePageTurn(direction, () => {
        currentDate = addDays(currentDate,direction);
        renderAgenda();
      });
    }else if(agendaView === 'week'){
      animatePageTurn(direction, () => {
        currentDate = addDays(currentDate,direction*7);
        renderAgenda();
      });
    }else{
      animatePageTurn(direction, () => {
        currentDate = addMonths(currentDate,direction);
        renderAgenda();
      });
    }
  }

  function renderDailyPage(){
    if(!DAILY_SECTIONS.includes(activeDailySection)) return;
    const key = isoDate(currentDate);
    $('sectionEyebrow').textContent = LABELS[activeDailySection];
    $('pageTitle').textContent = titleCaseFirst(formatDate(currentDate));
    dailyNotes.value = state.notes[activeDailySection]?.[key] || '';
    $('dailyPlaceholder').textContent = PLACEHOLDERS[activeDailySection];
    $('dailyPageNumber').textContent = `${formatShortDate(currentDate)} · ${sameDay(currentDate,new Date()) ? 'hoje' : 'página diária'}`;
    updateDailyPlaceholder();
    renderTimeline($('sharedTimeline'), currentDate);
  }

  function updateDailyPlaceholder(){
    $('dailyPlaceholder').style.display = dailyNotes.value ? 'none' : 'block';
  }

  function updateAgendaPlaceholder(){
    $('agendaPlaceholder').style.display = agendaNotes.value ? 'none' : 'block';
  }

  function renderFinancePage(){
    const key = monthKey(currentMonth);
    $('financeTitle').textContent = titleCaseFirst(new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(currentMonth));
    financeNotes.value = state.finance[key] || '';
    $('financePageNumber').textContent = `página mensal · ${key}`;
    updateFinancePlaceholder();
    renderFinanceBalance();
  }

  function updateFinancePlaceholder(){
    document.querySelector('.finance-page .page-placeholder').style.display = financeNotes.value ? 'none' : 'block';
  }

  function renderFinanceBalance(){
    $('financeBalance').textContent = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFinance(financeNotes.value));
  }

  function parseFinance(text){
    return text.split('\n').reduce((sum,line) => {
      const match = line.trim().match(/^([+-])\s*(?:R\$\s*)?([\d.]+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)/i);
      if(!match) return sum;
      let raw = match[2];
      if(raw.includes(',')) raw = raw.replace(/\./g,'').replace(',','.');
      const amount = Number(raw);
      return Number.isFinite(amount) ? sum + (match[1] === '-' ? -amount : amount) : sum;
    },0);
  }

  function turnDailyPage(direction){
    if(!DAILY_SECTIONS.includes(activeDailySection)) return;
    animatePageTurn(direction, () => {
      currentDate = addDays(currentDate,direction);
      renderDailyPage();
    });
  }

  function turnFinancePage(direction){
    animatePageTurn(direction, () => {
      currentMonth = addMonths(currentMonth,direction);
      renderFinancePage();
    });
  }

  function animatePageTurn(direction, update){
    if(pageTurning)return;
    pageTurning=true;

    const source=document.querySelector('.section.active-section');
    const layer=$('pageTurnLayer');

    if(!source||!layer){
      update?.();
      pageTurning=false;
      return;
    }

    const clone=source.cloneNode(true);
    const sourceTextareas=source.querySelectorAll('textarea');
    const cloneTextareas=clone.querySelectorAll('textarea');
    sourceTextareas.forEach((area,index)=>{
      if(cloneTextareas[index])cloneTextareas[index].textContent=area.value;
    });

    clone.classList.remove('active-section');
    clone.style.display='block';
    clone.style.minHeight='100%';

    const page=document.createElement('div');
    page.className=`turning-page ${direction>0?'next':'prev'}`;
    page.appendChild(clone);

    layer.innerHTML='';
    layer.appendChild(page);
    layer.classList.add('active');

    setTimeout(()=>update?.(),95);

    setTimeout(()=>{
      layer.classList.remove('active');
      layer.innerHTML='';
      pageTurning=false;
    },700);
  }

  function parseEventsForDate(date){
    const key = isoDate(date);
    const events = [];

    ['agenda','treino','dieta','trabalho'].forEach(section => {
      const text = state.notes[section]?.[key] || '';
      text.split('\n').forEach(line => {
        const parsed = parseTimedLine(line);
        if(parsed) events.push({...parsed,section,color:COLORS[section]});
      });
    });

    return events.sort((a,b) => a.start-b.start);
  }

  function parseTimedLine(line){
    const clean = line.trim();

    const range = clean.match(/^(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)?\s*(?:-|–|até)\s*(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)?\s+(.+)$/i);
    if(range){
      const sh=Number(range[1]),sm=Number(range[2]??range[3]??0),eh=Number(range[4]),em=Number(range[5]??range[6]??0);
      if(validTime(sh,sm) && validTime(eh,em)){
        const start=sh+sm/60;
        let end=eh+em/60;
        if(end<=start) end=start+1;
        return {start,end,label:range[7].trim(),time:`${pad2(sh)}:${pad2(sm)}–${pad2(eh)}:${pad2(em)}`};
      }
    }

    const single = clean.match(/^(\d{1,2})(?::(\d{2})|h(?:(\d{2}))?)\s+(.+)$/i);
    if(single){
      const h=Number(single[1]),m=Number(single[2]??single[3]??0);
      if(validTime(h,m)){
        const start=h+m/60;
        return {start,end:start+1,label:single[4].trim(),time:`${pad2(h)}:${pad2(m)}`};
      }
    }

    return null;
  }

  function validTime(h,m){ return h>=0 && h<=23 && m>=0 && m<=59; }
  function pad2(n){ return String(n).padStart(2,'0'); }

  function renderTimeline(container,date){
    if(!container) return;
    const startHour=6,endHour=24,span=endHour-startHour;
    container.innerHTML='';

    const grid=document.createElement('div');
    grid.className='timeline-grid';
    for(let i=0;i<span;i++) grid.appendChild(document.createElement('span'));
    container.appendChild(grid);

    parseEventsForDate(date).forEach(event => {
      const visibleStart=Math.max(event.start,startHour);
      const visibleEnd=Math.min(event.end,endHour);
      if(visibleEnd<=startHour || visibleStart>=endHour) return;

      const block=document.createElement('div');
      block.className='timeline-event';
      block.style.left=`${((visibleStart-startHour)/span)*100}%`;
      block.style.width=`${((visibleEnd-visibleStart)/span)*100}%`;
      block.style.background=event.color;
      block.title=`${event.time} ${event.label}`;
      container.appendChild(block);
    });

    const labels=document.createElement('div');
    labels.className='timeline-labels';
    labels.innerHTML='<span>06</span><span>12</span><span>18</span><span>24</span>';
    container.appendChild(labels);
  }

  function dayOfYear(date){
    const start=new Date(date.getFullYear(),0,0);
    return Math.floor((date-start)/86400000);
  }

  function reflectionForDate(date){
    const idx=(dayOfYear(date)+date.getFullYear())%REFLECTIONS.length;
    const [text,prompt]=REFLECTIONS[idx];
    return {key:isoDate(date),date:new Date(date),text,prompt};
  }

  function todayReflection(){ return reflectionForDate(new Date()); }

  function archiveReflection(reflection){
    state.reflectionHistory[reflection.key]={text:reflection.text,prompt:reflection.prompt};
    saveState();
  }

  function showDailyReflectionIfNeeded(){
    const today=todayReflection();
    archiveReflection(today);

    if(state.lastReflectionShown !== today.key){
      state.lastReflectionShown=today.key;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
      openReflection(today,true);
    }
  }

  function openReflection(reflection,isDaily){
    archiveReflection(reflection);
    $('reflectionDate').textContent=titleCaseFirst(formatDate(reflection.date));
    $('reflectionText').textContent=reflection.text;
    $('reflectionPrompt').textContent=reflection.prompt;
    $('reflectionModal').dataset.daily = isDaily ? '1' : '0';
    $('reflectionModal').classList.add('open');
    $('reflectionModal').setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }

  function closeReflectionModal(withTransition){
    const wasDaily = $('reflectionModal').dataset.daily === '1';
    $('reflectionModal').classList.remove('open');
    $('reflectionModal').setAttribute('aria-hidden','true');
    document.body.style.overflow='';

    if(withTransition && wasDaily){
      const reveal = $('entryReveal');
      reveal.classList.remove('run');
      void reveal.offsetWidth;
      reveal.classList.add('run');
      setTimeout(() => reveal.classList.remove('run'),760);
      setTimeout(maybeShowStickerHint,820);
    }
  }

  function renderReflectionHistory(){
    const root=$('reflectionHistory');
    root.innerHTML='';
    const entries=Object.entries(state.reflectionHistory).sort((a,b)=>b[0].localeCompare(a[0]));

    if(!entries.length){
      root.innerHTML='<div class="empty-history">As reflexões dos dias em que você abrir o VIVA aparecerão aqui.</div>';
      return;
    }

    entries.forEach(([key,item]) => {
      const date=new Date(`${key}T12:00:00`);
      const btn=document.createElement('button');
      const time=document.createElement('time');
      const strong=document.createElement('strong');

      btn.className='history-item';
      time.textContent=titleCaseFirst(formatDate(date));
      strong.textContent=item.text;
      btn.append(time,strong);

      btn.addEventListener('click', () => openReflection({key,date,text:item.text,prompt:item.prompt||''},false));
      root.appendChild(btn);
    });
  }

  function bindPageGestures(){
    let startX=0,startY=0,tracking=false;

    paper.addEventListener('touchstart',e => {
      if(currentSection==='home' || currentSection==='reflections') return;
      const target=e.target;
      if(target.closest('textarea,input,button,.week-strip,.month-grid')) return;
      const touch=e.touches[0];
      startX=touch.clientX;
      startY=touch.clientY;
      tracking=true;
    },{passive:true});

    paper.addEventListener('touchend',e => {
      if(!tracking) return;
      tracking=false;
      const touch=e.changedTouches[0];
      const dx=touch.clientX-startX;
      const dy=touch.clientY-startY;

      if(Math.abs(dx)<70 || Math.abs(dx)<Math.abs(dy)*1.25) return;

      const direction=dx<0?1:-1;
      if(currentSection==='agenda') turnAgenda(direction);
      else if(currentSection==='financeiro') turnFinancePage(direction);
      else if(DAILY_SECTIONS.includes(currentSection)) turnDailyPage(direction);
    },{passive:true});
  }

  function showToast(message){
    const toast=$('toast');
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),1600);
  }

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try{
        const registration = await navigator.serviceWorker.register('./sw.js');
        registration.update();
      }catch(err){
        console.warn('Service worker não registrado:',err);
      }
    });
  }
})();