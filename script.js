"use strict";

const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_FILE_NAMES = {
  "♠": "Spades",
  "♥": "Hearts",
  "♦": "Diamonds",
  "♣": "Clubs"
};
const RANKS = [
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 11 },
  { label: "Q", value: 12 },
  { label: "K", value: 13 },
  { label: "A", value: 14 }
];

const HAND_NAMES = [
  "High Card",
  "Pair",
  "Two Pair",
  "Three of a Kind",
  "Straight",
  "Flush",
  "Full House",
  "Four of a Kind",
  "Straight Flush"
];

const STARTING_STACK = 1000;
const HUMAN_INDEX = 0;
const DEALER_REACTION_IMAGES = {
  neutral: "assets/dealer_rat/Rat_Happy.png",
  check: "assets/dealer_rat/Rat_Idle.png",
  call: "assets/dealer_rat/Rat_Smug.png",
  raise: "assets/dealer_rat/Rat_Surprised.png",
  fold: "assets/dealer_rat/Rat_Sad.png",
  allIn: "assets/dealer_rat/Rat_AllIn.png",
  win: "assets/dealer_rat/Rat_Happy.png",
  lose: "assets/dealer_rat/Rat_Sad.png"
};
const CPU_PERSONAS = {
  patient: {
    foldBias: 7,
    aggression: -8,
    callBias: 4,
    raises: ["quietly stacks a raise", "waits, then raises"],
    bets: ["leads into the current", "sets out a careful bet"],
    calls: ["counts out a patient call", "smooth-calls"],
    checks: ["checks with a tiny nod", "taps the felt"],
    folds: ["lets the hand drift away", "folds without a squeak"]
  },
  balanced: {
    foldBias: 0,
    aggression: 0,
    callBias: 0,
    raises: ["raises with steady whiskers", "pushes in a raise"],
    bets: ["bets cleanly", "slides out a bet"],
    calls: ["calls", "matches the bet"],
    checks: ["checks", "knocks the table"],
    folds: ["folds", "mucks the cards"]
  },
  sticky: {
    foldBias: -8,
    aggression: -3,
    callBias: 9,
    raises: ["finds a stubborn raise", "raises after a long stare"],
    bets: ["bets with a grin", "splashes out a bet"],
    calls: ["sticks around with a call", "refuses to leave and calls"],
    checks: ["checks, still lurking", "checks with narrowed eyes"],
    folds: ["finally gives it up", "folds with a dramatic sigh"]
  },
  splashy: {
    foldBias: -4,
    aggression: 12,
    callBias: 2,
    raises: ["pounces with a raise", "fires a bright raise"],
    bets: ["snaps out a bet", "throws a bold bet forward"],
    calls: ["calls with a wink", "flicks in a call"],
    checks: ["checks a little too innocently", "checks and watches everyone"],
    folds: ["folds, already plotting", "ditches the hand with flair"]
  }
};

const els = {
  seats: [...Array(5)].map((_, index) => document.getElementById(`seat-${index}`)),
  dealerRat: document.getElementById("dealer-rat"),
  community: document.getElementById("community-cards"),
  pot: document.getElementById("pot-amount"),
  street: document.getElementById("street-label"),
  turnInfo: document.getElementById("turn-info"),
  banner: document.getElementById("banner"),
  log: document.getElementById("hand-log"),
  smallBlind: document.getElementById("small-blind"),
  bigBlind: document.getElementById("big-blind"),
  betAmount: document.getElementById("bet-amount"),
  betLabel: document.getElementById("bet-label"),
  actionTitle: document.getElementById("action-title"),
  actionDetail: document.getElementById("action-detail"),
  fold: document.getElementById("fold-btn"),
  checkCall: document.getElementById("check-call-btn"),
  betRaise: document.getElementById("bet-raise-btn"),
  newHand: document.getElementById("new-hand-btn")
};

const game = {
  players: [],
  deck: [],
  community: [],
  dealerIndex: -1,
  currentPlayer: null,
  street: "waiting",
  handNumber: 0,
  pot: 0,
  currentBet: 0,
  minRaise: 10,
  smallBlind: 5,
  bigBlind: 10,
  handInProgress: false,
  awaitingNextHand: false,
  lastAggressor: null,
  message: "Press New Hand to sit down.",
  log: []
};

function initGame() {
  game.players = [
    createPlayer("You", false, "balanced"),
    createPlayer("Cheddar Chuck", true, "patient"),
    createPlayer("Marina Whiskers", true, "balanced"),
    createPlayer("Saffron Squeak", true, "splashy"),
    createPlayer("Barnacle Pip", true, "sticky")
  ];
  wireEvents();
  render();
}

function createPlayer(name, cpu, persona) {
  return {
    name,
    cpu,
    persona,
    stack: STARTING_STACK,
    hand: [],
    folded: false,
    allIn: false,
    committed: 0,
    acted: false,
    lastAction: "Waiting"
  };
}

function wireEvents() {
  els.newHand.addEventListener("click", startHand);
  els.fold.addEventListener("click", () => handleHumanAction("fold"));
  els.checkCall.addEventListener("click", () => handleHumanAction("checkCall"));
  els.betRaise.addEventListener("click", () => handleHumanAction("betRaise"));
}

function startHand() {
  readBlindSettings();
  if (activePlayers().length < 2) {
    resetBustedStacks();
    showBanner("Fresh cheese markers issued. Everyone is back in.");
  }
  rotateDealer();
  game.handNumber += 1;
  game.deck = shuffle(createDeck());
  game.community = [];
  game.pot = 0;
  game.currentBet = 0;
  game.minRaise = game.bigBlind;
  game.street = "preflop";
  game.handInProgress = true;
  game.awaitingNextHand = false;
  game.lastAggressor = null;
  game.log = [];

  game.players.forEach((player) => {
    player.hand = [];
    player.folded = player.stack <= 0;
    player.allIn = false;
    player.committed = 0;
    player.acted = false;
    player.lastAction = player.stack <= 0 ? "Busted" : "Waiting";
  });

  postBlinds();
  dealHoleCards();
  addLog(`Hand ${game.handNumber}: dealer button to ${game.players[game.dealerIndex].name}.`);
  showBanner(game.dealerIndex === HUMAN_INDEX ? "New hand. You have the button." : `New hand. ${game.players[game.dealerIndex].name} has the button.`);

  const bigBlindIndex = nextSeatedPlayer(nextSeatedPlayer(game.dealerIndex));
  game.currentPlayer = getNextActivePlayer(bigBlindIndex);
  if (game.currentPlayer === null) {
    game.message = "All remaining players are all-in. Dealing to showdown.";
    render();
    window.setTimeout(completeBettingRound, 700);
    return;
  }
  game.message = game.currentPlayer === HUMAN_INDEX ? "You act first preflop." : `${game.players[game.currentPlayer].name} acts first preflop.`;
  render();
  continueIfCpuTurn();
}

function readBlindSettings() {
  const smallBlind = Math.max(1, Number.parseInt(els.smallBlind.value, 10) || 5);
  const bigBlind = Math.max(smallBlind + 1, Number.parseInt(els.bigBlind.value, 10) || 10);
  game.smallBlind = smallBlind;
  game.bigBlind = bigBlind;
  els.smallBlind.value = smallBlind;
  els.bigBlind.value = bigBlind;
}

function resetBustedStacks() {
  game.players.forEach((player) => {
    player.stack = STARTING_STACK;
  });
}

function rotateDealer() {
  game.dealerIndex = nextSeatedPlayer(game.dealerIndex);
}

function postBlinds() {
  const smallBlindIndex = nextSeatedPlayer(game.dealerIndex);
  const bigBlindIndex = nextSeatedPlayer(smallBlindIndex);
  commitChips(smallBlindIndex, game.smallBlind);
  game.players[smallBlindIndex].lastAction = `Small blind $${game.players[smallBlindIndex].committed}`;
  commitChips(bigBlindIndex, game.bigBlind);
  game.players[bigBlindIndex].lastAction = `Big blind $${game.players[bigBlindIndex].committed}`;
  game.currentBet = game.players[bigBlindIndex].committed;
  game.lastAggressor = bigBlindIndex;
  addLog(`${game.players[smallBlindIndex].name} posts $${game.smallBlind}; ${game.players[bigBlindIndex].name} posts $${game.bigBlind}.`);
}

function dealHoleCards() {
  for (let round = 0; round < 2; round += 1) {
    for (let offset = 1; offset <= game.players.length; offset += 1) {
      const playerIndex = (game.dealerIndex + offset) % game.players.length;
      if (game.players[playerIndex].stack > 0 && !game.players[playerIndex].folded) {
        game.players[playerIndex].hand.push(game.deck.pop());
      }
    }
  }
}

function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ ...rank, suit })));
}

function shuffle(deck) {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function handleHumanAction(action) {
  if (!game.handInProgress || game.currentPlayer !== HUMAN_INDEX) return;
  const player = game.players[HUMAN_INDEX];
  const callAmount = legalCallAmount(player);

  if (action === "fold") {
    player.folded = true;
    player.acted = true;
    player.lastAction = "Folded";
    addLog("You fold.");
    advanceTurn();
    return;
  }

  if (action === "checkCall") {
    commitChips(HUMAN_INDEX, callAmount);
    player.acted = true;
    player.lastAction = callAmount > 0 ? `Called $${callAmount}` : "Checked";
    addLog(callAmount > 0 ? `You call $${callAmount}.` : "You check.");
    advanceTurn();
    return;
  }

  const targetBet = Number.parseInt(els.betAmount.value, 10);
  const result = betOrRaiseTo(HUMAN_INDEX, targetBet);
  if (result.ok) {
    addLog(`You ${game.currentBet === player.committed ? "raise" : "bet"} to $${player.committed}.`);
    advanceTurn();
  } else {
    showBanner(result.reason);
  }
}

function runCpuTurn() {
  if (!game.handInProgress || game.currentPlayer === null) return;
  const index = game.currentPlayer;
  const player = game.players[index];
  if (!player.cpu || player.folded || player.allIn) return;

  const callAmount = legalCallAmount(player);
  const strength = estimateHandStrength(index);
  const roll = Math.random();
  const persona = CPU_PERSONAS[player.persona] || CPU_PERSONAS.balanced;

  if (callAmount > 0 && callAmount >= player.stack && strength < 48 + persona.foldBias && roll < 0.55) {
    player.folded = true;
    player.acted = true;
    player.lastAction = "Folded";
    addLog(cpuActionLine(player, "fold"));
    setDealerReaction("fold");
  } else if (callAmount > 0 && strength + roll * 35 + persona.callBias < 42 + persona.foldBias && callAmount > game.bigBlind) {
    player.folded = true;
    player.acted = true;
    player.lastAction = "Folded";
    addLog(cpuActionLine(player, "fold"));
    setDealerReaction("fold");
  } else if (shouldCpuRaise(strength, callAmount, roll, player.stack, persona)) {
    const raiseSize = game.currentBet === 0 ? game.bigBlind : game.currentBet + game.minRaise;
    const target = Math.min(player.committed + player.stack, raiseSize + Math.floor(strength / 18) * game.bigBlind);
    const action = game.currentBet === 0 ? "bet" : "raise";
    betOrRaiseTo(index, target);
    addLog(cpuActionLine(player, action, player.committed));
    setDealerReaction(player.allIn ? "allIn" : "raise");
  } else {
    commitChips(index, callAmount);
    player.acted = true;
    player.lastAction = callAmount > 0 ? `Called $${callAmount}` : "Checked";
    addLog(cpuActionLine(player, callAmount > 0 ? "call" : "check", callAmount));
    setDealerReaction(callAmount > 0 ? "call" : "check");
  }

  render();
  window.setTimeout(advanceTurn, 520);
}

function shouldCpuRaise(strength, callAmount, roll, stack, persona = CPU_PERSONAS.balanced) {
  if (stack <= callAmount) return false;
  const adjustedStrength = strength + persona.aggression;
  if (game.street === "preflop") return adjustedStrength > 72 && roll > 0.42 - persona.aggression / 100;
  if (callAmount === 0) return adjustedStrength > 58 && roll > 0.58 - persona.aggression / 100;
  return adjustedStrength > 76 && roll > 0.52 - persona.aggression / 100;
}

function cpuActionLine(player, action, amount = 0) {
  const persona = CPU_PERSONAS[player.persona] || CPU_PERSONAS.balanced;
  const phrases = {
    bet: persona.bets,
    raise: persona.raises,
    call: persona.calls,
    check: persona.checks,
    fold: persona.folds
  }[action];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const suffix = amount > 0 ? `${action === "call" ? " for $" : " to $"}${amount}` : "";
  return `${player.name} ${phrase}${suffix}.`;
}

function betOrRaiseTo(playerIndex, targetBet) {
  const player = game.players[playerIndex];
  if (!Number.isFinite(targetBet)) return { ok: false, reason: "Enter a valid chip amount." };
  targetBet = Math.floor(targetBet);

  const maxTarget = player.committed + player.stack;
  const previousBet = game.currentBet;
  const minTarget = previousBet === 0 ? game.bigBlind : previousBet + game.minRaise;

  if (targetBet > maxTarget) targetBet = maxTarget;
  if (targetBet <= previousBet) return { ok: false, reason: "That is not more than the current bet." };
  if (targetBet < minTarget && targetBet < maxTarget) {
    return { ok: false, reason: `Minimum is $${minTarget}, unless moving all-in.` };
  }

  commitChips(playerIndex, targetBet - player.committed);
  if (player.committed > previousBet) {
    game.minRaise = Math.max(game.bigBlind, player.committed - previousBet);
    game.currentBet = player.committed;
    game.lastAggressor = playerIndex;
    game.players.forEach((other, index) => {
      if (index !== playerIndex && !other.folded && !other.allIn) other.acted = false;
    });
  }
  player.acted = true;
  player.lastAction = previousBet === 0 ? `Bet $${player.committed}` : `Raised to $${player.committed}`;
  return { ok: true };
}

function commitChips(playerIndex, amount) {
  const player = game.players[playerIndex];
  const chips = Math.max(0, Math.min(amount, player.stack));
  player.stack -= chips;
  player.committed += chips;
  game.pot += chips;
  if (player.stack === 0) player.allIn = true;
  return chips;
}

function advanceTurn() {
  if (!game.handInProgress) return;

  const livePlayers = game.players.filter((player) => !player.folded);
  if (livePlayers.length === 1) {
    awardPot([game.players.indexOf(livePlayers[0])], `${livePlayers[0].name} wins uncontested.`);
    return;
  }

  if (isBettingRoundComplete()) {
    completeBettingRound();
    return;
  }

  game.currentPlayer = getNextActivePlayer(game.currentPlayer);
  if (game.currentPlayer === null) {
    completeBettingRound();
    return;
  }
  game.message = game.currentPlayer === HUMAN_INDEX ? "Your turn." : `${game.players[game.currentPlayer].name}'s turn.`;
  render();
  continueIfCpuTurn();
}

function isBettingRoundComplete() {
  const needAction = game.players.filter((player) => !player.folded && !player.allIn);
  if (needAction.length === 0) return true;
  return needAction.every((player) => player.acted && player.committed === game.currentBet);
}

function completeBettingRound() {
  game.players.forEach((player) => {
    player.committed = 0;
    player.acted = false;
  });
  game.currentBet = 0;
  game.minRaise = game.bigBlind;
  game.lastAggressor = null;

  if (game.street === "river") {
    showdown();
    return;
  }

  dealStreet();
  startBettingRound();
}

function dealStreet() {
  if (game.street === "preflop") {
    game.community.push(game.deck.pop(), game.deck.pop(), game.deck.pop());
    game.street = "flop";
    addLog(`Flop: ${game.community.map(formatCard).join(" ")}.`);
    showBanner("The flop splashes onto the felt.");
    return;
  }

  if (game.street === "flop") {
    game.community.push(game.deck.pop());
    game.street = "turn";
    addLog(`Turn: ${formatCard(game.community[3])}.`);
    showBanner("Turn card on the river bend.");
    return;
  }

  if (game.street === "turn") {
    game.community.push(game.deck.pop());
    game.street = "river";
    addLog(`River: ${formatCard(game.community[4])}.`);
    showBanner("River card. Whiskers twitch.");
  }
}

function startBettingRound() {
  const first = getNextActivePlayer(game.dealerIndex);
  if (first === null) {
    game.message = "All remaining players are all-in. Dealing to showdown.";
    render();
    window.setTimeout(completeBettingRound, 700);
    return;
  }
  game.currentPlayer = first;
  game.message = first === HUMAN_INDEX ? `You start ${game.street}.` : `${game.players[first].name} starts ${game.street}.`;
  render();
  continueIfCpuTurn();
}

function showdown() {
  const contenders = game.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => !player.folded);

  const scored = contenders.map(({ player, index }) => ({
    index,
    score: evaluateBestHand([...player.hand, ...game.community])
  }));
  scored.sort((a, b) => compareScores(b.score, a.score));

  const best = scored[0].score;
  const winners = scored.filter((entry) => compareScores(entry.score, best) === 0).map((entry) => entry.index);
  const winnerNames = winners.map((index) => game.players[index].name).join(" and ");
  const handName = HAND_NAMES[best.category];
  addLog(`Showdown: ${winnerNames} win with ${handName}.`);
  awardPot(winners, `${winnerNames} win with ${handName}.`);
}

function awardPot(winnerIndexes, message) {
  const share = Math.floor(game.pot / winnerIndexes.length);
  let remainder = game.pot - share * winnerIndexes.length;
  winnerIndexes.forEach((index) => {
    game.players[index].stack += share + (remainder > 0 ? 1 : 0);
    remainder -= 1;
  });
  game.pot = 0;
  game.currentPlayer = null;
  game.handInProgress = false;
  game.awaitingNextHand = true;
  game.street = "showdown";
  game.message = "Hand complete. Start the next hand when ready.";
  const resultType = winnerIndexes.includes(HUMAN_INDEX) ? "win" : "lose";
  setDealerReaction(resultType);
  showBanner(message, resultType);
  render();
}

function getNextActivePlayer(fromIndex) {
  for (let step = 1; step <= game.players.length; step += 1) {
    const index = (fromIndex + step + game.players.length) % game.players.length;
    const player = game.players[index];
    if (!player.folded && !player.allIn && player.stack > 0 && player.hand.length > 0) return index;
  }
  return null;
}

function leftOf(index) {
  return (index + 1 + game.players.length) % game.players.length;
}

function nextSeatedPlayer(fromIndex) {
  for (let step = 1; step <= game.players.length; step += 1) {
    const index = (fromIndex + step + game.players.length) % game.players.length;
    if (game.players[index].stack > 0) return index;
  }
  return 0;
}

function activePlayers() {
  return game.players.filter((player) => player.stack > 0);
}

function legalCallAmount(player) {
  return Math.max(0, Math.min(game.currentBet - player.committed, player.stack));
}

function continueIfCpuTurn() {
  render();
  if (game.currentPlayer === null) return;
  if (game.players[game.currentPlayer].cpu) {
    window.setTimeout(runCpuTurn, 620);
  }
}

function estimateHandStrength(playerIndex) {
  const player = game.players[playerIndex];
  const cards = [...player.hand, ...game.community];
  if (cards.length >= 5) {
    const score = evaluateBestHand(cards);
    return score.category * 13 + score.ranks[0];
  }

  const [a, b] = player.hand;
  if (!a || !b) return 20;
  let strength = a.value + b.value;
  if (a.value === b.value) strength += 32 + a.value;
  if (a.suit === b.suit) strength += 8;
  if (Math.abs(a.value - b.value) <= 2) strength += 5;
  if (Math.max(a.value, b.value) >= 13) strength += 8;
  return strength;
}

function evaluateBestHand(cards) {
  const combos = combinations(cards, 5);
  return combos.map(evaluateFive).sort((a, b) => compareScores(b, a))[0];
}

function evaluateFive(cards) {
  const values = cards.map((card) => card.value).sort((a, b) => b - a);
  const suits = cards.map((card) => card.suit);
  const flush = suits.every((suit) => suit === suits[0]);
  const straightHigh = getStraightHigh(values);

  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const groups = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  if (flush && straightHigh) return { category: 8, ranks: [straightHigh] };
  if (groups[0].count === 4) return { category: 7, ranks: [groups[0].value, groups[1].value] };
  if (groups[0].count === 3 && groups[1].count === 2) return { category: 6, ranks: [groups[0].value, groups[1].value] };
  if (flush) return { category: 5, ranks: values };
  if (straightHigh) return { category: 4, ranks: [straightHigh] };
  if (groups[0].count === 3) {
    return { category: 3, ranks: [groups[0].value, ...groups.slice(1).map((group) => group.value).sort((a, b) => b - a)] };
  }
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = groups.filter((group) => group.count === 2).map((group) => group.value).sort((a, b) => b - a);
    const kicker = groups.find((group) => group.count === 1).value;
    return { category: 2, ranks: [...pairs, kicker] };
  }
  if (groups[0].count === 2) {
    return { category: 1, ranks: [groups[0].value, ...groups.slice(1).map((group) => group.value).sort((a, b) => b - a)] };
  }
  return { category: 0, ranks: values };
}

function getStraightHigh(values) {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i += 1) {
    const slice = unique.slice(i, i + 5);
    if (slice[0] - slice[4] === 4) return slice[0];
  }
  return null;
}

function combinations(items, size) {
  const result = [];
  function walk(start, combo) {
    if (combo.length === size) {
      result.push(combo);
      return;
    }
    for (let i = start; i <= items.length - (size - combo.length); i += 1) {
      walk(i + 1, [...combo, items[i]]);
    }
  }
  walk(0, []);
  return result;
}

function compareScores(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.ranks.length, b.ranks.length); i += 1) {
    const diff = (a.ranks[i] || 0) - (b.ranks[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function render() {
  renderPlayers();
  renderCommunity();
  renderControls();
  els.pot.textContent = `$${game.pot}`;
  els.street.textContent = titleCase(game.street);
  els.turnInfo.textContent = game.message;
  els.log.innerHTML = game.log.map((entry) => `<li>${entry}</li>`).join("");
}

function renderPlayers() {
  game.players.forEach((player, index) => {
    const badges = [];
    if (index === game.dealerIndex) badges.push(`<span class="badge dealer">D</span>`);
    if (player.allIn) badges.push(`<span class="badge status">All-in</span>`);
    if (player.folded) badges.push(`<span class="badge status">Fold</span>`);

    const cards = player.hand
      .map((card) => {
        const hidden = player.cpu && game.handInProgress && game.street !== "showdown" && !player.folded;
        return hidden ? renderCard(null, true) : renderCard(card);
      })
      .join("");

    els.seats[index].className = `player-panel seat ${seatClass(index)} seat-art-${index}${game.currentPlayer === index ? " is-turn" : ""}${player.folded ? " is-folded" : ""}`;
    els.seats[index].innerHTML = `
      <div class="player-head">
        <span class="player-name">${player.name}</span>
        <span class="badge-row">${badges.join("")}</span>
      </div>
      <div class="player-stats">
        <div><span>Stack</span><strong>$${player.stack}</strong></div>
        <div><span>Bet</span><strong>$${player.committed}</strong></div>
        <div><span>Status</span><strong>${player.lastAction}</strong></div>
      </div>
      <div class="card-row">${cards || renderCard(null, true) + renderCard(null, true)}</div>
    `;
  });
}

function seatClass(index) {
  return ["bottom-seat human-seat", "left-seat", "top-left-seat", "top-right-seat", "right-seat"][index];
}

function renderCommunity() {
  const cards = [...game.community];
  while (cards.length < 5) cards.push(null);
  els.community.innerHTML = cards.map((card) => renderCard(card, !card)).join("");
}

function renderCard(card, back = false) {
  if (back) {
    return `<img class="card back" src="assets/cards/Card_Back.png" alt="Face-down River Rat card" />`;
  }
  const src = `assets/cards/${card.label}_of_${SUIT_FILE_NAMES[card.suit]}.png`;
  return `<img class="card" src="${src}" alt="${card.label}${card.suit}" />`;
}

function renderControls() {
  const humanTurn = game.handInProgress && game.currentPlayer === HUMAN_INDEX;
  const player = game.players[HUMAN_INDEX];
  const callAmount = legalCallAmount(player);
  const canBet = humanTurn && player.stack > callAmount;
  els.fold.disabled = !humanTurn;
  els.checkCall.disabled = !humanTurn;
  els.betRaise.disabled = !canBet;
  els.checkCall.textContent = callAmount > 0 ? `Call $${callAmount}` : "Check";
  els.checkCall.classList.toggle("call-mode", callAmount > 0);
  els.checkCall.classList.toggle("check-mode", callAmount === 0);
  els.betRaise.textContent = game.currentBet > 0 ? "Raise" : "Bet";
  els.betLabel.textContent = game.currentBet > 0 ? "Raise To" : "Bet Amount";

  const minimum = game.currentBet > 0 ? game.currentBet + game.minRaise : game.bigBlind;
  els.betAmount.min = minimum;
  els.betAmount.step = game.bigBlind;
  if (Number(els.betAmount.value) < minimum) els.betAmount.value = minimum;

  els.newHand.textContent = game.awaitingNextHand ? "Next Hand" : "New Hand";
  els.actionTitle.textContent = humanTurn ? "Your action" : game.handInProgress ? "Rats are thinking" : "No hand in progress";
  els.actionDetail.textContent = humanTurn
    ? `Current bet $${game.currentBet}. You have committed $${player.committed}.`
    : game.message;
}

function showBanner(message, type = "neutral") {
  els.banner.textContent = message;
  els.banner.classList.remove("win", "lose");
  if (type === "win" || type === "lose") els.banner.classList.add(type);
  els.banner.classList.add("show");
  window.clearTimeout(showBanner.timer);
  showBanner.timer = window.setTimeout(() => els.banner.classList.remove("show"), 1800);
}

function setDealerReaction(reaction) {
  els.dealerRat.src = DEALER_REACTION_IMAGES[reaction] || DEALER_REACTION_IMAGES.neutral;
  window.clearTimeout(setDealerReaction.timer);
  if (reaction !== "neutral") {
    setDealerReaction.timer = window.setTimeout(() => {
      els.dealerRat.src = DEALER_REACTION_IMAGES.neutral;
    }, 1400);
  }
}

function addLog(entry) {
  game.log.unshift(entry);
  game.log = game.log.slice(0, 40);
}

function formatCard(card) {
  return `${card.label}${card.suit}`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

initGame();
