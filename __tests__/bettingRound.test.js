const { bettingRound } = require('../bettingRound');

describe('bettingRound', () => {
  test('processes raise, call, and fold correctly', () => {
    const players = [
      { stack: 100, bet: 0, folded: false },
      { stack: 100, bet: 0, folded: false },
      { stack: 100, bet: 0, folded: false }
    ];

    const actions = [
      { playerIndex: 0, type: 'raise', amount: 10 },
      { playerIndex: 1, type: 'call' },
      { playerIndex: 2, type: 'fold' }
    ];

    const result = bettingRound(players, actions);

    expect(result.pot).toBe(20);
    expect(result.players[0].stack).toBe(90);
    expect(result.players[1].stack).toBe(90);
    expect(result.players[2].folded).toBe(true);
    expect(result.sidePots).toEqual([{ amount: 20, players: [0, 1] }]);
  });

  test('handles equal all-ins', () => {
    const players = [
      { stack: 50, bet: 0, folded: false },
      { stack: 50, bet: 0, folded: false }
    ];

    const actions = [
      { playerIndex: 0, type: 'raise', amount: 50 },
      { playerIndex: 1, type: 'call' }
    ];

    const result = bettingRound(players, actions);

    expect(result.pot).toBe(100);
    expect(result.players[0].stack).toBe(0);
    expect(result.players[1].stack).toBe(0);
    expect(result.sidePots).toEqual([{ amount: 100, players: [0, 1] }]);
  });

  test('creates side pot when all-in with different amounts', () => {
    const players = [
      { stack: 50, bet: 0, folded: false },
      { stack: 100, bet: 0, folded: false },
      { stack: 100, bet: 0, folded: false }
    ];

    const actions = [
      { playerIndex: 0, type: 'raise', amount: 50 },
      { playerIndex: 1, type: 'raise', amount: 50 },
      { playerIndex: 2, type: 'call' }
    ];

    const result = bettingRound(players, actions);

    expect(result.pot).toBe(250);
    expect(result.sidePots).toEqual([
      { amount: 150, players: [0, 1, 2] },
      { amount: 100, players: [1, 2] }
    ]);
  });
});
