/* River Rat Poker — Blinds + Fixed-Limit Betting (basic)
 * Adds:
 * - Dealer rotation
 * - SB/BB posting
 * - One betting round per street (3-raise cap)
 * - Very simple CPU actions
 * - Auto-advance streets; showdown at the end (or earlier if everyone folds)
 *
 * Keep extending:
 * - Hand payouts / chip push animations
 * - Better CPU logic
 * - Side pots / all-in logic (not needed with deep stacks + small bets)
 */

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

// ---- Config ----
const CFG = {
  sb: 5,
  bb: 10,
  smallBet: 10,  // preflop + flop
  bigBet: 20,    // turn + river
  maxRaises: 3,
  cpuThinkMs: [450, 900] // min..max
};

const state = {
  players: [
    { name: "You", stack: 1000, hole: [], folded: false },
    { name: "CPU 1", stack: 1000, hole: [], folded: false },
    { name: "CPU 2", stack: 1000, hole: [], folded: false },
    { name: "CPU 3", stack: 1000, hole: [], folded: false },
  ],
  deck: [],
  board: [],
  street: "idle", // idle | preflop | flop | turn | river | showdown
  pot: 0,
  dealerPos: 0,

  // betting round state
  contributions: [0,0,0,0], // this street
  currentBet: 0,            // amount to call on this street
  raisesThisStreet: 0,
  toAct: 0,
  toActSet: new Set(),      // who still must act to close the round (reset on raise)
};

// ---------- DOM helpers ----------
const logEl = (msg) => {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  line.className = "log-line";
  line.textContent = msg;
  el.prepend(line);
};

const setStatus = (msg) => document.getElementById("status").textContent = msg;
const setPot = () => document.getElementById("pot").textContent = `Pot: ${state.pot.toLocaleString()}`;

function formatCard(c){ return `${c.rank}${c.suit}`; }

function $(id){ return document.getElementById(id); }

// Fisher–Yates shuffle
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [array[i],array[j]] = [array[j],array[i]];
  }
  return array;
}

function buildDeck(){
  const d = [];
  for(const s of SUITS){
    for(const r of RANKS){
      d.push({rank:r, suit:s});
    }
  }
  return shuffle(d);
}

// ---------- Rendering ----------
function cardNode(card, faceUp=true){
  const el = document.createElement("div");
  el.className = "card" + (!faceUp ? " back" : "") + ((card && (card.suit==="♥"||card.suit==="♦")) ? " red" : "");
  if(faceUp && card){
    const r = document.createElement("div");
    r.className = "rank";
    r.textContent = card.rank;
    const s = document.createElement("div");
    s.className = "suit";
    s.textContent = card.suit;
    el.appendChild(r);
    el.appendChild(s);
  }
  return el;
}

function render(){
  // stacks
  state.players.forEach((p, idx)=>{
    const st = $(`stack${idx}`);
    if(st) st.textContent = p.stack.toLocaleString();
  });

  // board
  const board = $("board");
  board.innerHTML = "";
  state.board.forEach(c => board.appendChild(cardNode(c, true)));

  // players
  state.players.forEach((p, idx)=>{
    const hole = $(`p${idx}`);
    if(!hole) return;
    const showFace = (idx===0) || state.street==="showdown";
    hole.classList.toggle("face-down", !showFace);
    hole.innerHTML = "";
    p.hole.forEach(c => {
      hole.appendChild(cardNode(c, showFace));
    });
    const seat = document.querySelector(`.seat[data-seat="${idx}"]`);
    seat.style.opacity = p.folded ? .5 : 1;
  });

  // dealer button
  document.querySelectorAll(".dealer-btn").forEach(el=>{
    const seatIdx = Number(el.getAttribute("data-d"));
    el.hidden = seatIdx !== state.dealerPos;
  });

  setPot();
}

// ---------- Hand evaluation (7-card) ----------
const RANK_MAP = Object.fromEntries(RANKS.map((r,i)=>[r,i])); // 2..A => 0..12
function sortByRankDesc(cards){ return [...cards].sort((a,b)=>RANK_MAP[b.rank]-RANK_MAP[a.rank]); }
function countsByRank(cards){
  const map = new Map();
  for(const c of cards){
    map.set(c.rank,(map.get(c.rank)||0)+1);
  }
  return map;
}
function isStraight(vals){
  const uniq = Array.from(new Set(vals));
  if(uniq.length<5) return null;
  for(let i=0;i<=uniq.length-5;i++){
    const run = uniq.slice(i,i+5);
    if(run.every((v,idx)=> idx===0 || v===run[idx-1]-1)) return run[0];
  }
  if(uniq.includes(12) && uniq.includes(3) && uniq.includes(2) && uniq.includes(1) && uniq.includes(0)){
    return 3; // 5-high straight
  }
  return null;
}
function evaluate7(cards){
  const bySuit = new Map();
  for(const c of cards){ (bySuit.get(c.suit)||bySuit.set(c.suit,[]).get(c.suit)).push(c); }

  let flushSuit = null;
  for(const [s,arr] of bySuit){ if(arr.length>=5){ flushSuit = s; break; } }
  if(flushSuit){
    const suited = sortByRankDesc(bySuit.get(flushSuit));
    const suitedVals = suited.map(c=>RANK_MAP[c.rank]);
    const highSF = isStraight(suitedVals);
    if(highSF!==null) return [8, highSF];
  }

  const rc = countsByRank(cards);
  const groups = {};
  for(const [r,cnt] of rc){ (groups[String(cnt)] ||= []).push(RANK_MAP[r]); }
  for(const k of Object.keys(groups)) groups[k].sort((a,b)=>b-a);

  if(groups["4"] && groups["4"].length){
    const quad = groups["4"][0];
    const kickers = sortByRankDesc(cards).map(c=>RANK_MAP[c.rank]).filter(v=>v!==quad);
    return [7, quad, kickers[0]];
  }
  const trips = groups["3"]||[];
  const pairs = groups["2"]||[];
  if(trips.length>=2) return [6, trips[0], trips[1]];
  if(trips.length>=1 && pairs.length>=1) return [6, trips[0], pairs[0]];
  if(flushSuit){
    const top5 = sortByRankDesc(bySuit.get(flushSuit)).slice(0,5).map(c=>RANK_MAP[c.rank]);
    return [5, ...top5];
  }
  const allVals = sortByRankDesc(cards).map(c=>RANK_MAP[c.rank]);
  const highStraight = isStraight(allVals);
  if(highStraight!==null) return [4, highStraight];
  if(trips.length>=1){
    const trip = trips[0];
    const kickers = allVals.filter(v=>v!==trip);
    return [3, trip, kickers[0], kickers[1]];
  }
  if(pairs.length>=2){
    const p1 = pairs[0], p2 = pairs[1];
    const kicker = allVals.find(v=>v!==p1 && v!==p2);
    return [2, p1, p2, kicker];
  }
  if(pairs.length===1){
    const p = pairs[0];
    const kickers = allVals.filter(v=>v!==p);
    return [1, p, kickers[0], kickers[1], kickers[2]];
  }
  const top = allVals.slice(0,5);
  return [0, ...top];
}
function compareRanks(a,b){
  const len = Math.max(a.length,b.length);
  for(let i=0;i<len;i++){
    const av = a[i]??-1, bv = b[i]??-1;
    if(av!==bv) return av-bv;
  }
  return 0;
}
function bestOf7(two, board){ return evaluate7(two.concat(board)); }

// ---------- Helpers: table / betting ----------
function nextIdx(i){
  const n = state.players.length;
  for(let step=1; step<=n; step++){
    const j = (i + step) % n;
    if(!state.players[j].folded) return j;
  }
  return i; // fallback
}
function activeIndices(){ return state.players.map((p,i)=>({p,i})).filter(x=>!x.p.folded).map(x=>x.i); }
function allActiveMatched(){
  return activeIndices().every(i => state.contributions[i] === state.currentBet);
}
function betSizeForStreet(){
  return (state.street==="preflop" || state.street==="flop") ? CFG.smallBet : CFG.bigBet;
}
function contribute(i, amount){
  if(amount<=0) return;
  const p = state.players[i];
  p.stack -= amount;
  state.pot += amount;
  state.contributions[i] += amount;
}
function needToCall(i){ return Math.max(0, state.currentBet - state.contributions[i]); }
function anyoneLeftToAct(){ return state.toActSet.size > 0; }

// ---------- Dealing & Streets ----------
function resetHand(){
  state.deck = buildDeck();
  state.board = [];
  state.pot = 0;
  state.players.forEach(p=>{ p.hole = []; p.folded = false; });
  state.street = "preflop";
  state.contributions = [0,0,0,0];
  state.raisesThisStreet = 0;
  state.currentBet = 0;
  setStatus("Preflop: cards are being dealt…");
  $("nextBtn").disabled = true;
  $("showBtn").disabled = true;
  render();
}

function dealHole(){
  for(let r=0;r<2;r++){
    for(let i=0;i<state.players.length;i++){
      const card = state.deck.pop();
      state.players[i].hole.push(card);
    }
  }
  logEl("Dealer: Hole cards dealt.");
  render();
}

function goFlop(){
  state.deck.pop(); // burn
  state.board.push(state.deck.pop(),state.deck.pop(),state.deck.pop());
  state.street = "flop";
  logEl("Dealer: The Flop.");
  setStatus("Flop");
  render();
}
function goTurn(){
  state.deck.pop();
  state.board.push(state.deck.pop());
  state.street = "turn";
  logEl("Dealer: The Turn.");
  setStatus("Turn");
  render();
}
function goRiver(){
  state.deck.pop();
  state.board.push(state.deck.pop());
  state.street = "river";
  logEl("Dealer: The River.");
  setStatus("River");
  render();
}

// ---------- Betting Round Engine ----------
function initBettingRound(){
  // Reset street betting state
  state.contributions = [0,0,0,0];
  state.raisesThisStreet = 0;
  state.currentBet = 0;
  state.toActSet = new Set(activeIndices());

  // Preflop: post blinds and set order
  if(state.street === "preflop"){
    const sbIdx = (state.dealerPos + 1) % state.players.length;
    const bbIdx = (state.dealerPos + 2) % state.players.length;
    contribute(sbIdx, CFG.sb);
    contribute(bbIdx, CFG.bb);
    state.currentBet = CFG.bb;

    // action starts UTG (left of BB)
    state.toAct = (state.dealerPos + 3) % state.players.length;
    setStatus(`Preflop — SB ${CFG.sb}, BB ${CFG.bb}`);
    logEl(`Blinds posted: SB (Seat ${sbIdx}) ${CFG.sb}, BB (Seat ${bbIdx}) ${CFG.bb}. Pot ${state.pot}.`);
  } else {
    // Postflop: first to act is left of dealer
    state.toAct = (state.dealerPos + 1) % state.players.length;
    setStatus(`${state.street[0].toUpperCase()}${state.street.slice(1)} — Fixed limit`);
  }
  render();
  maybeAct();
}

function endStreetOrHandIfReady(){
  // If only one player remains -> award pot immediately
  const actives = activeIndices();
  if(actives.length === 1){
    const w = actives[0];
    logEl(`Everyone else folded. Seat ${w} (${state.players[w].name}) wins ${state.pot.toLocaleString()}.`);
    state.players[w].stack += state.pot;
    state.pot = 0;
    state.street = "showdown";
    setStatus("Hand over (no showdown).");
    $("showBtn").disabled = true;
    render();
    return true;
  }

  // Normal round end when everyone has acted and matched
  if(state.toActSet.size === 0 && (state.currentBet === 0 || allActiveMatched())){
    // Move to next street or showdown
    if(state.street === "preflop"){ goFlop(); initBettingRound(); }
    else if(state.street === "flop"){ goTurn(); initBettingRound(); }
    else if(state.street === "turn"){ goRiver(); initBettingRound(); }
    else if(state.street === "river"){ showdown(); }
    return true;
  }
  return false;
}

function nextActor(){
  state.toAct = nextIdx(state.toAct);
}

function onPlayerAction(idx, kind){
  // Remove them from the "must act" set unless they raised (raise resets it)
  if(kind !== "raise" && kind !== "bet"){
    state.toActSet.delete(idx);
  }
  render();
  if(!endStreetOrHandIfReady()){
    nextActor();
    maybeAct();
  }
}

function betOrRaise(idx){
  const p = state.players[idx];
  const betSize = betSizeForStreet();

  if(state.currentBet === 0){
    // Opening bet
    contribute(idx, betSize);
    state.currentBet = betSize;
    state.raisesThisStreet = 1;
    logEl(`${p.name} bets ${betSize}.`);
  } else {
    // Raise
    if(state.raisesThisStreet >= CFG.maxRaises){
      // If capped, treat as call instead
      return call(idx);
    }
    const target = state.currentBet + betSize;
    const need = target - state.contributions[idx];
    contribute(idx, need);
    state.currentBet = target;
    state.raisesThisStreet++;
    logEl(`${p.name} raises to ${target}.`);
  }

  // After a bet/raise, everyone else must respond
  state.toActSet = new Set(activeIndices().filter(i=>i!==idx));
  render();
  onPlayerAction(idx, state.currentBet===betSize ? "bet" : "raise");
}

function call(idx){
  const need = needToCall(idx);
  if(need <= 0){
    // It's a check
    logEl(`${state.players[idx].name} checks.`);
    onPlayerAction(idx, "check");
    return;
  }
  contribute(idx, need);
  logEl(`${state.players[idx].name} calls ${need}.`);
  onPlayerAction(idx, "call");
}

function fold(idx){
  state.players[idx].folded = true;
  // Also remove from toActSet if present
  state.toActSet.delete(idx);
  logEl(`${state.players[idx].name} folds.`);
  onPlayerAction(idx, "fold");
}

// ---------- Turn driver ----------
function maybeAct(){
  // Enable/disable user buttons
  const heroTurn = state.toAct === 0 && !state.players[0].folded && state.street!=="showdown";
  updateActionButtons(heroTurn);

  if(heroTurn) return; // wait for user

  // CPU turn
  const idx = state.toAct;
  if(state.players[idx].folded){ nextActor(); return maybeAct(); }

  const need = needToCall(idx);
  const canRaise = (state.currentBet===0 || state.raisesThisStreet < CFG.maxRaises);
  const r = Math.random();

  const doAfter = () => {
    // decide
    if(need > 0){
      if(canRaise && r < 0.15){ betOrRaise(idx); }
      else if(r < 0.10){ fold(idx); }
      else { call(idx); }
    } else {
      if(canRaise && r < 0.18){ betOrRaise(idx); }
      else { call(idx); } // this becomes a check
    }
  };

  const [min,max] = CFG.cpuThinkMs;
  const delay = Math.floor(min + Math.random()*(max-min));
  setTimeout(doAfter, delay);
}

// ---------- UI: your buttons ----------
function updateActionButtons(enabled){
  const foldBtn = $("foldBtn");
  const ccBtn = $("checkCallBtn");
  const brBtn = $("betRaiseBtn");
  foldBtn.disabled = true; ccBtn.disabled = true; brBtn.disabled = true;

  if(!enabled) return;

  const need = needToCall(0);
  const canRaise = (state.currentBet===0 || state.raisesThisStreet < CFG.maxRaises);

  // Fold is only meaningful facing a bet
  foldBtn.disabled = !(need > 0);

  // Check or Call
  ccBtn.textContent = need > 0 ? `Call ${need}` : `Check`;
  ccBtn.disabled = false;

  // Bet or Raise
  const size = betSizeForStreet();
  brBtn.textContent = state.currentBet===0 ? `Bet ${size}` : `Raise ${size}`;
  brBtn.disabled = !canRaise;
}

$("foldBtn").addEventListener("click", ()=> fold(0));
$("checkCallBtn").addEventListener("click", ()=> call(0));
$("betRaiseBtn").addEventListener("click", ()=> betOrRaise(0));

// ---------- Hand lifecycle ----------
function showdown(){
  state.street = "showdown";
  setStatus("Showdown!");
  $("showBtn").disabled = true;

  // Evaluate
  const results = state.players
    .map((p,idx)=> p.folded ? null : ({ idx, rank: bestOf7(p.hole, state.board), name: p.name }))
    .filter(Boolean)
    .sort((a,b)=>compareRanks(a.rank,b.rank)).reverse();

  const best = results[0].rank;
  const winners = results.filter(r=>compareRanks(r.rank,best)===0);
  const names = winners.map(w=>`Seat ${w.idx} (${state.players[w.idx].name})`);

  // Split pot evenly for ties (no cents)
  const share = Math.floor(state.pot / winners.length);
  winners.forEach(w => state.players[w.idx].stack += share);
  const remainder = state.pot - share*winners.length; // house keeps? give to first winner
  if(remainder > 0) state.players[winners[0].idx].stack += remainder;

  logEl(`Winner: ${names.join(" & ")} — each gets ${share}${remainder?` (+${remainder} extra to ${state.players[winners[0].idx].name})`:""}.`);
  state.pot = 0;

  // Reveal CPU cards
  render();
}

// ---------- Controls ----------
function newHand(){
  // Rotate dealer
  state.dealerPos = (state.dealerPos + 1) % state.players.length;

  resetHand();
  dealHole();

  // Start betting (preflop)
  initBettingRound();
}

$("newHandBtn").addEventListener("click", ()=> newHand());
$("nextBtn").addEventListener("click", ()=> {
  // Manual advance safety (kept from starter)
  // If you click this, it will try to force-end the current round.
  if(!endStreetOrHandIfReady()){
    logEl("Next Street pressed, but betting round not closed yet.");
  }
});
$("showBtn").addEventListener("click", ()=> showdown());

// Initial render
render();
setStatus("Ready. Click ‘New Hand’ to deal.");
