document.addEventListener('DOMContentLoaded', () => {
  let seatCount = parseInt(prompt('How many seats? (2-8)', '6'), 10);
  if (isNaN(seatCount) || seatCount < 2 || seatCount > 8) {
    seatCount = 6;
  }

  const table = document.getElementById('table');
  const radius = 240;
  const center = 300; // Half of table width/height

  for (let i = 0; i < seatCount; i++) {
    const angle = (2 * Math.PI / seatCount) * i;
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.textContent = `Seat ${i + 1}`;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    seat.style.left = `${x}px`;
    seat.style.top = `${y}px`;
    table.appendChild(seat);
  }
});
