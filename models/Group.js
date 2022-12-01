const GROUP = Object.freeze({
  NONE: 0, //* icon = none; do nothing                      no-change-of-state
  ENGINEER: 1, //*icon = gear;open 2 and play               state-pick-card-and-target x2 if can; auto if only single target
  ORACLE: 2, //*icon = eye; draw 2 cards                    no-change-of-state
  WORKER: 3, //*icon = pickaxe; play card for free          play-card-no-race-limit-state
  MAGE: 4, //*icon = ??; steal top card                     state-pick-card-as-target
  BOMBER: 5, //*icon = dynamite; destroy incomplete tower   state-pick-tower-as-target
  SABOTEUR: 6, //*icon = ??; destroy top slot of your tower state-pick-tower-as-target
});

module.exports = GROUP;
