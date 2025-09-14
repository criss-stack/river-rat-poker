/* River Rat Poker (Starter)
 * Focus: dealing + board progression + 7-card hand evaluation + winner pick
 * Extend later: blinds, betting flow, CPU AI, animations, sounds
 */

const SUITS = ["♠","♥","♦","♣"];
const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];

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
  dealerPos: 0
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
function setActionButtons(disabled){
  ["foldBtn","callBtn","betBtn"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.disabled = disabled;
  });
}

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

// ---------- Game flow ----------
function resetHand(){
  state.deck = buildDeck();
  state.board = [];
  state.pot = 0;
  state.players.forEach(p=>{
    p.hole = [];
    p.folded = false;
  });
  state.street = "preflop";
  setStatus("Preflop: cards are being dealt…");
  document.getElementById("nextBtn").disabled = false;
  document.getElementById("showBtn").disabled = true;
  setActionButtons(false);
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
  // Evaluate
  const results = state.players.map((p,idx)=>{
    const rank = bestOf7(p.hole, state.board);
    return { idx, rank, name: p.name, hole: p.hole };
  });
  results.sort((a,b)=>compareRanks(a.rank,b.rank)).reverse();
  // Handle ties (split pot)
  const best = results[0].rank;
  const winners = results.filter(r=>compareRanks(r.rank,best)===0);
  const names = winners.map(w=>`Seat ${w.idx} (${state.players[w.idx].name})`);
  logEl(`Winner: ${names.join(" & ")}.`);
  names.forEach(n=>logEl(`— ${n}`));
  // Reveal CPU cards
  render();
  setActionButtons(true);
}

function bettingRound(action){
  const hero = state.players[0];
  if(state.street === "idle"){
    logEl("Dealer: No hand in progress.");
    return;
  }
  switch(action){
    case "fold":
      hero.folded = true;
      logEl(`${hero.name} folds.`);
      setActionButtons(true);
      break;
    case "call":
      logEl(`${hero.name} calls/checks.`);
      break;
    case "bet":
      const amt = 50;
      if(hero.stack >= amt){
        hero.stack -= amt;
        state.pot += amt;
        logEl(`${hero.name} bets ${amt}.`);
      } else if(hero.stack > 0){
        state.pot += hero.stack;
        logEl(`${hero.name} goes all-in for ${hero.stack}.`);
        hero.stack = 0;
      } else {
        logEl(`${hero.name} has no chips left.`);
      }
      break;
  }
  render();
}

// ---------- Controls ----------
function nextStreet(){
  if(state.street==="preflop"){ goFlop(); }
  else if(state.street==="flop"){ goTurn(); }
  else if(state.street==="turn"){ goRiver(); document.getElementById("nextBtn").disabled = true; document.getElementById("showBtn").disabled = false; }
}

function newHand(){
  resetHand();
  dealHole();
  // In a later version, rotate dealer & post blinds here
}

document.getElementById("newHandBtn").addEventListener("click", ()=>{
  newHand();
});
document.getElementById("nextBtn").addEventListener("click", nextStreet);
document.getElementById("showBtn").addEventListener("click", showdown);
document.getElementById("foldBtn").addEventListener("click", ()=>bettingRound("fold"));
document.getElementById("callBtn").addEventListener("click", ()=>bettingRound("call"));
document.getElementById("betBtn").addEventListener("click", ()=>bettingRound("bet"));

// Initial render
render();
setStatus("Ready. Click ‘New Hand’ to deal.");

/* -------------------------------------------
   Extension hooks (for you to implement next):
   - rotateDealer(), postBlinds(small, big)
   - bettingRound(street): action queue, legal moves, pot management
   - simpleCPUDecision(handRank, potOdds)
   - animations (flip/reveal), sounds (chip, flip)
   Keep this file single-purpose; consider splitting into modules later.
-------------------------------------------- */
