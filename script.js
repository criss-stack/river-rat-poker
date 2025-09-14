/* River Rat Poker (Starter)
 * Focus: dealing + board progression + 7-card hand evaluation + winner pick
 * Extend later: blinds, betting flow, CPU AI, animations, sounds
 */

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

// --- CONFIG ---
const SMALL_BLIND = 10;
const BIG_BLIND   = 20;
// Fixed-limit bet sizes: preflop/flop use 1x, turn/river use 2x
const STREET_BET_SIZES = { preflop: BIG_BLIND, flop: BIG_BLIND, turn: BIG_BLIND * 2, river: BIG_BLIND * 2 };
const MAX_RAISES_PER_STREET = 3; // classic cap

const state = {
  players: [
    { id: 0, name: "You", stack: 1000, hole: [], folded: false, committed: 0, isHuman: true },
    { id: 1, name: "CPU 1", stack: 1000, hole: [], folded: false, committed: 0, isHuman: false },
    { id: 2, name: "CPU 2", stack: 1000, hole: [], folded: false, committed: 0, isHuman: false },
    { id: 3, name: "CPU 3", stack: 1000, hole: [], folded: false, committed: 0, isHuman: false },
  ],
  deck: [],
  board: [],
  street: "idle", // idle | preflop | flop | turn | river | showdown
  pot: 0,
  buttonIdx: 0,
  currentToAct: null,
  lastAggressor: null,
  raisesThisStreet: 0,
  streetBetToCall: 0
};

// ---------- Utilities ----------
const logEl = (msg) => {
  const el = document.getElementById("log");
  const line = document.createElement("div");
  line.className = "log-line";
  line.textContent = msg;
  el.prepend(line);
};

const setStatus = (msg) => document.getElementById("status").textContent = msg;
const setPot = () => document.getElementById("pot").textContent = `Pot: ${state.pot}`;

function formatCard(c){ return `${c.rank}${c.suit}`; }

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

function nextIdx(i){ return (i + 1) % state.players.length; }
function activePlayers(){ return state.players.filter(p => !p.folded && p.stack >= 0); }
function resetStreet(){
  state.raisesThisStreet = 0;
  state.streetBetToCall = 0;
  state.players.forEach(p => p.committed = 0);
}
function post(amount, p){
  const pay = Math.min(amount, p.stack);
  p.stack -= pay;
  p.committed += pay;
  state.pot += pay;
}
function log(msg){ logEl(`[RiverRat] ${msg}`); }

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
    const st = document.getElementById(`stack${idx}`);
    if(st) st.textContent = p.stack.toLocaleString();
  });

  // board
  const board = document.getElementById("board");
  board.innerHTML = "";
  state.board.forEach(c => board.appendChild(cardNode(c, true)));

  // players
  state.players.forEach((p, idx)=>{
    const hole = document.getElementById(`p${idx}`);
    if(!hole) return;
    hole.classList.toggle("face-down", idx!==0 && state.street!=="showdown");
    hole.innerHTML = "";
    const faceUp = idx===0 || state.street==="showdown";
    p.hole.forEach(c => {
      const el = cardNode(c, faceUp);
      if(faceUp && idx!==0 && state.street!=="showdown"){
        el.classList.add("reveal"); // keep cpu cards visible at showdown only
      }
      hole.appendChild(el);
    });
    const seat = document.querySelector(`.seat[data-seat="${idx}"]`);
    seat.style.opacity = p.folded ? .5 : 1;
  });

  setPot();
}

// ---------- Hand evaluation (7-card) ----------
/* Returns a rank array for comparison.
   Higher is better lexicographically.
   Format:
   [category, tiebreakers...]
   Categories:
     8 = Straight Flush
     7 = Four of a Kind
     6 = Full House
     5 = Flush
     4 = Straight
     3 = Three of a Kind
     2 = Two Pair
     1 = One Pair
     0 = High Card
*/
const RANK_MAP = Object.fromEntries(RANKS.map((r,i)=>[r,i])); // 2..A => 0..12

function sortByRankDesc(cards){
  return [...cards].sort((a,b)=>RANK_MAP[b.rank]-RANK_MAP[a.rank]);
}

function countsByRank(cards){
  const map = new Map();
  for(const c of cards){
    const k = c.rank;
    map.set(k,(map.get(k)||0)+1);
  }
  return map;
}

function isStraight(vals){
  // vals: unique sorted high-to-low numeric ranks [12..0]
  // Handle A-5 straight (A=12 -> treat as -1 tail)
  const uniq = Array.from(new Set(vals));
  if(uniq.length<5) return null;

  // normal
  for(let i=0;i<=uniq.length-5;i++){
    const run = uniq.slice(i,i+5);
    if(run.every((v,idx)=> idx===0 || v===run[idx-1]-1)){
      return run[0]; // high card of straight
    }
  }
  // wheel (A,5,4,3,2)
  if(uniq.includes(12) && uniq.includes(3) && uniq.includes(2) && uniq.includes(1) && uniq.includes(0)){
    return 3; // 5-high straight, treat high=3 (the '5')
  }
  return null;
}

function evaluate7(cards){
  // Precompute helpers
  const bySuit = new Map();
  for(const c of cards){
    const arr = bySuit.get(c.suit) || [];
    arr.push(c);
    bySuit.set(c.suit, arr);
  }

  // Flush / Straight Flush
  let flushSuit = null;
  for(const [s,arr] of bySuit){
    if(arr.length>=5){ flushSuit = s; break; }
  }
  if(flushSuit){
    const suited = sortByRankDesc(bySuit.get(flushSuit));
    const suitedVals = suited.map(c=>RANK_MAP[c.rank]);
    const highSF = isStraight(suitedVals);
    if(highSF!==null){
      // Straight flush
      return [8, highSF];
    }
  }

  const rankCounts = countsByRank(cards);
  // Build arrays for kinds
  const groups = {};
  for(const [r,cnt] of rankCounts){
    const key = String(cnt);
    (groups[key] ||= []).push(RANK_MAP[r]);
  }
  for(const k of Object.keys(groups)) groups[k].sort((a,b)=>b-a);

  // Four of a kind
  if(groups["4"] && groups["4"].length){
    const quad = groups["4"][0];
    const kickers = sortByRankDesc(cards).map(c=>RANK_MAP[c.rank]).filter(v=>v!==quad);
    return [7, quad, kickers[0]];
  }

  // Full house
  const trips = groups["3"]||[];
  const pairs = groups["2"]||[];
  if(trips.length>=2){
    // use highest trip as trips, next trip as pair
    return [6, trips[0], trips[1]];
  }
  if(trips.length>=1 && pairs.length>=1){
    return [6, trips[0], pairs[0]];
  }

  // Flush
  if(flushSuit){
    const top5 = sortByRankDesc(bySuit.get(flushSuit)).slice(0,5).map(c=>RANK_MAP[c.rank]);
    return [5, ...top5];
  }

  // Straight
  const allVals = sortByRankDesc(cards).map(c=>RANK_MAP[c.rank]);
  const highStraight = isStraight(allVals);
  if(highStraight!==null){
    return [4, highStraight];
  }

  // Trips
  if(trips.length>=1){
    const trip = trips[0];
    const kickers = allVals.filter(v=>v!==trip);
    return [3, trip, kickers[0], kickers[1]];
  }

  // Two Pair
  if(pairs.length>=2){
    const p1 = pairs[0], p2 = pairs[1];
    const kicker = allVals.find(v=>v!==p1 && v!==p2);
    return [2, p1, p2, kicker];
  }

  // One Pair
  if(pairs.length===1){
    const p = pairs[0];
    const kickers = allVals.filter(v=>v!==p);
    return [1, p, kickers[0], kickers[1], kickers[2]];
  }

  // High Card
  const top = allVals.slice(0,5);
  return [0, ...top];
}

function compareRanks(a,b){
  // compare lexicographically
  const len = Math.max(a.length,b.length);
  for(let i=0;i<len;i++){
    const av = a[i]??-1;
    const bv = b[i]??-1;
    if(av!==bv) return av-bv;
  }
  return 0;
}

function bestOf7(two, board){
  const all = two.concat(board);
  return evaluate7(all);
}

function evaluateBestHand(player, board){
  return bestOf7(player.hole, board);
}

// ---------- Game flow ----------
function resetHand(){
  state.deck = buildDeck();
  state.board = [];
  state.pot = 0;
  state.players.forEach(p=>{
    p.hole = [];
    p.folded = false;
    p.committed = 0;
  });
  state.street = "preflop";
  setStatus("Preflop: cards are being dealt…");
  document.getElementById("nextBtn").disabled = false;
  document.getElementById("showBtn").disabled = true;
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
  // burn
  state.deck.pop();
  // flop
  state.board.push(state.deck.pop(),state.deck.pop(),state.deck.pop());
  state.street = "flop";
  setStatus("Flop dealt.");
  logEl("Dealer: The Flop.");
  render();
}

function goTurn(){
  state.deck.pop();
  state.board.push(state.deck.pop());
  state.street = "turn";
  setStatus("Turn dealt.");
  logEl("Dealer: The Turn.");
  render();
}

function goRiver(){
  state.deck.pop();
  state.board.push(state.deck.pop());
  state.street = "river";
  setStatus("River dealt.");
  logEl("Dealer: The River.");
  render();
}

function showdown(){
  state.street = "showdown";
  setStatus("Showdown!");
  document.getElementById("showBtn").disabled = true;

  const alive = activePlayers();
  if(alive.length === 1){
    const winner = alive[0];
    winner.stack += state.pot;
    log(`${winner.name} wins ${state.pot} (everyone else folded).`);
    state.pot = 0;
    render();
    return;
  }

  const results = alive.map(p => ({ player: p, score: evaluateBestHand(p, state.board) }));
  results.sort((a,b)=>compareRanks(a.score,b.score)).reverse();
  const top = results[0].score;
  const winners = results.filter(r=>compareRanks(r.score, top)===0).map(r=>r.player);

  if(winners.length === 1){
    winners[0].stack += state.pot;
    log(`${winners[0].name} wins ${state.pot} at showdown.`);
  }else{
    const share = Math.floor(state.pot / winners.length);
    winners.forEach(w => w.stack += share);
    log(`Split pot: ${winners.map(w=>w.name).join(" & ")}` + ` split ${state.pot} (${share} each).`);
  }
  state.pot = 0;
  render();
}

function isHandOver(){
  return activePlayers().length <= 1;
}

async function postBlinds(){
  resetStreet();
  state.street = "preflop";

  const sbIdx = nextIdx(state.buttonIdx);
  const bbIdx = nextIdx(sbIdx);
  const sb = state.players[sbIdx];
  const bb = state.players[bbIdx];

  post(SMALL_BLIND, sb);
  post(BIG_BLIND, bb);

  state.streetBetToCall = BIG_BLIND;
  state.lastAggressor = bbIdx;

  state.currentToAct = nextIdx(bbIdx);

  log(`${sb.name} posts SB ${SMALL_BLIND}, ${bb.name} posts BB ${BIG_BLIND}. Pot=${state.pot}`);
}

async function bettingRound(street){
  state.street = street;
  if(street !== "preflop") resetStreet();
  const betSize = STREET_BET_SIZES[street];

  if(street !== "preflop"){
    state.currentToAct = nextIdx(state.buttonIdx);
    state.lastAggressor = null;
  }

  let continueRound = true;

  while(continueRound){
    const p = state.players[state.currentToAct];
    if(!p.folded && p.stack >= 0){
      const action = await getAction(p, betSize);
      applyAction(p, action, betSize);

      if(action.type === "raise"){
        state.lastAggressor = p.id;
      }

      if(isHandOver()) break;

      if(actionEndsStreet()){
        continueRound = false;
        break;
      }
    }

    state.currentToAct = nextIdx(state.currentToAct);
  }

  state.players.forEach(p => p.committed = 0);
}

function actionEndsStreet(){
  const alive = activePlayers();
  if(alive.length <= 1) return true;

  const need = state.streetBetToCall;
  const allMatched = alive.every(p => p.folded || p.committed === need);

  if(state.lastAggressor == null) return allMatched;

  return allMatched && state.currentToAct === state.lastAggressor;
}

async function getAction(player, betSize){
  const toCall = state.streetBetToCall - player.committed;
  const canRaise = state.raisesThisStreet < MAX_RAISES_PER_STREET && player.stack > toCall + betSize;

  if(player.isHuman){
    return await getHumanAction({ toCall, canRaise, betSize });
  }else{
    return getCpuAction({ player, toCall, canRaise, betSize });
  }
}

function getCpuAction({ player, toCall, canRaise, betSize }){
  const strength = Math.random();

  if(toCall === 0){
    if(canRaise && strength > 0.75) return { type: "raise" };
    return { type: "check" };
  }else{
    if(strength > 0.80 && canRaise) return { type: "raise" };
    if(strength > 0.25) return { type: "call" };
    return { type: "fold" };
  }
}

function getHumanAction({ toCall, canRaise, betSize }){
  return new Promise(resolve => {
    const opts = [];
    if(toCall === 0) opts.push("check");
    else opts.push("call", "fold");
    if(canRaise) opts.push(toCall === 0 ? "bet" : "raise");

    const msg = `Your move: ${opts.join("/")} (toCall=${toCall}, betSize=${betSize})`;
    const choice = (window.prompt(msg) || "").toLowerCase();
    if(choice === "fold")  return resolve({ type: "fold" });
    if(choice === "call")  return resolve({ type: "call" });
    if(choice === "check") return resolve({ type: "check" });
    if(choice === "bet")   return resolve({ type: "raise" });
    if(choice === "raise") return resolve({ type: "raise" });
    resolve(toCall === 0 ? { type: "check" } : { type: "call" });
  });
}

function applyAction(p, action, betSize){
  const toCall = state.streetBetToCall - p.committed;

  switch(action.type){
    case "fold":
      p.folded = true;
      log(`${p.name} folds`);
      break;
    case "check":
      log(`${p.name} checks`);
      break;
    case "call": {
      const pay = Math.min(toCall, p.stack);
      post(pay, p);
      log(`${p.name} calls ${pay}. Pot=${state.pot}`);
      break;
    }
    case "raise": {
      if(toCall > 0){
        const pay = Math.min(toCall + betSize, p.stack);
        post(pay, p);
        state.streetBetToCall += betSize;
      }else{
        const pay = Math.min(betSize, p.stack);
        post(pay, p);
        state.streetBetToCall = betSize;
      }
      state.raisesThisStreet += 1;
      log(`${p.name} ${toCall > 0 ? "raises" : "bets"} to ${state.streetBetToCall}. Pot=${state.pot}`);
      break;
    }
    default:
      log(`${p.name} does nothing (BUG?)`);
  }
}

async function startHand(){
  resetHand();
  state.buttonIdx = nextIdx(state.buttonIdx);
  dealHole();
  await postBlinds();
  await bettingRound("preflop");
  if(isHandOver()) return showdown();

  goFlop();
  await bettingRound("flop");
  if(isHandOver()) return showdown();

  goTurn();
  await bettingRound("turn");
  if(isHandOver()) return showdown();

  goRiver();
  await bettingRound("river");
  return showdown();
}

// ---------- Controls ----------
document.getElementById("newHandBtn").addEventListener("click", ()=>{
  startHand();
});
document.getElementById("showBtn").addEventListener("click", showdown);

// Initial render
render();
setStatus("Ready. Click ‘New Hand’ to deal.");
