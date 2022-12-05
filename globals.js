let totalPlayers = 0;

const shuffle = (array) => {
  //* https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

function* range(start, stop, step = 1) {
  if (stop == null) {
    stop = start;
    start = 0;
  }
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    yield i;
  }
}

module.exports = { totalPlayers, shuffle, range };
