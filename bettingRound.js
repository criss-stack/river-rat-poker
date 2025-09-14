function bettingRound(players, actions) {
  let currentBet = 0;

  actions.forEach(action => {
    const player = players[action.playerIndex];
    if (!player || player.folded || player.allIn) return;

    player.bet = player.bet || 0;

    switch (action.type) {
      case 'fold':
        player.folded = true;
        break;
      case 'call': {
        let toCall = currentBet - player.bet;
        if (toCall > player.stack) {
          toCall = player.stack;
          player.allIn = true;
        }
        player.stack -= toCall;
        player.bet += toCall;
        if (player.stack === 0) player.allIn = true;
        break;
      }
      case 'raise': {
        let toCall = currentBet - player.bet;
        let total = toCall + (action.amount || 0);
        if (total >= player.stack) {
          total = player.stack;
          player.allIn = true;
        }
        player.stack -= total;
        player.bet += total;
        currentBet = Math.max(currentBet, player.bet);
        if (player.stack === 0) player.allIn = true;
        break;
      }
    }
  });

  const pot = players.reduce((sum, p) => sum + (p.bet || 0), 0);

  const active = players
    .map((p, idx) => ({ idx, bet: p.bet || 0, folded: p.folded }))
    .filter(p => !p.folded && p.bet > 0)
    .sort((a, b) => a.bet - b.bet);

  const sidePots = [];
  let prev = 0;
  while (active.length > 0) {
    const curr = active[0].bet;
    const eligible = active.map(p => p.idx);
    const amount = (curr - prev) * eligible.length;
    if (amount > 0) sidePots.push({ amount, players: eligible });
    prev = curr;
    active.shift();
  }

  return { players, pot, sidePots };
}

module.exports = { bettingRound };
