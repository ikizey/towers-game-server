const GROUP = Object.freeze({
  NONE: 0, //* icon = none; do nothing
  ENGINEER: 1, //*icon = gear;open 2 and play
  ORACLE: 2, //*icon = eye; draw 2 cards
  WORKER: 3, //*icon = pickaxe; play card for free
  MAGE: 4, //*icon = ??; steal top card
  BOMBER: 5, //*icon = dynamite; destroy incomplete tower
  SABOTEUR: 6, //*icon = ??; destroy top slot of your tower
});

module.exports = GROUP;
