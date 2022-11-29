const RACE = require('./Race');
const TOWER_SLOTS = require('./TowerSlots');
const GROUP = require('./Group');

const ALL_CARDS = [
  //	0
  {
    id: 0,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 1,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 2,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	1
  {
    id: 3,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.MAGE,
  },
  {
    id: 4,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  {
    id: 5,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  //	2
  {
    id: 6,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.MAGE,
  },
  {
    id: 7,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  {
    id: 8,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  //	3
  {
    id: 9,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.WORKER,
  },
  {
    id: 10,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.WORKER,
  },
  {
    id: 11,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  //	4
  {
    id: 12,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.SABOTEUR,
  },
  {
    id: 13,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.SABOTEUR,
  },
  {
    id: 14,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  //	5
  {
    id: 15,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 16,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 17,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	6
  {
    id: 18,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.MAGE,
  },
  {
    id: 19,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.MAGE,
  },
  {
    id: 20,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  //	7
  {
    id: 21,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.MAGE,
  },
  {
    id: 22,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.MAGE,
  },
  {
    id: 23,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  //	8
  {
    id: 24,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.MAGE,
  },
  {
    id: 25,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.MAGE,
  },
  {
    id: 26,
    race: RACE.ELF,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.MAGE,
  },
  //	9
  {
    id: 27,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.SABOTEUR,
  },
  {
    id: 28,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  {
    id: 29,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  //	10
  {
    id: 30,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 31,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.WORKER,
  },
  {
    id: 32,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	11
  {
    id: 33,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 34,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 35,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  //	12
  {
    id: 36,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.WORKER,
  },
  {
    id: 37,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  {
    id: 38,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  //	13
  {
    id: 39,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 40,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  {
    id: 41,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  //	14
  {
    id: 42,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 43,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.WORKER,
  },
  {
    id: 44,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  //	15
  {
    id: 45,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 46,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.ORACLE,
  },
  {
    id: 47,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  //	16
  {
    id: 48,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 49,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.ORACLE,
  },
  {
    id: 50,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  //	17
  {
    id: 51,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ORACLE,
  },
  {
    id: 52,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.SABOTEUR,
  },
  {
    id: 53,
    race: RACE.ORC,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	18
  {
    id: 54,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 55,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  {
    id: 56,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  //	19
  {
    id: 57,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ENGINEER,
  },
  {
    id: 58,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  {
    id: 59,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  //	20
  {
    id: 60,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.WORKER,
  },
  {
    id: 61,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  {
    id: 62,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.WORKER,
  },
  //	21
  {
    id: 63,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ENGINEER,
  },
  {
    id: 64,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.ENGINEER,
  },
  {
    id: 65,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  //	22
  {
    id: 66,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 67,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.ENGINEER,
  },
  {
    id: 68,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	23
  {
    id: 69,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ORACLE,
  },
  {
    id: 70,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  {
    id: 71,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  //	24
  {
    id: 72,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 73,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 74,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	25
  {
    id: 75,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 76,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 77,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	26
  {
    id: 78,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ENGINEER,
  },
  {
    id: 79,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.ENGINEER,
  },
  {
    id: 80,
    race: RACE.HUMAN,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.ENGINEER,
  },
  //	27
  {
    id: 81,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.BOMBER,
  },
  {
    id: 82,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.BOMBER,
  },
  {
    id: 83,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.BOMBER,
  },
  //	28
  {
    id: 84,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.BOMBER,
  },
  {
    id: 85,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.BOMBER,
  },
  {
    id: 86,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	29
  {
    id: 87,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 88,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 89,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  //	30
  {
    id: 90,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 91,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.ORACLE,
  },
  {
    id: 92,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
  //	31
  {
    id: 93,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.BOMBER,
  },
  {
    id: 94,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.BOMBER,
  },
  {
    id: 95,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.BOMBER,
  },
  //	32
  {
    id: 96,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.ORACLE,
  },
  {
    id: 97,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.ORACLE,
  },
  {
    id: 98,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE, TOWER_SLOTS.TOP],
    group: GROUP.SABOTEUR,
  },
  //	33
  {
    id: 99,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.BOMBER,
  },
  {
    id: 100,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.BOMBER,
  },
  {
    id: 101,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.BOMBER,
  },
  //	34
  {
    id: 102,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 103,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 104,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.BOMBER,
  },
  //	35
  {
    id: 105,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE],
    group: GROUP.NONE,
  },
  {
    id: 106,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.BASE, TOWER_SLOTS.MIDDLE],
    group: GROUP.NONE,
  },
  {
    id: 107,
    race: RACE.UNDEAD,
    slots: [TOWER_SLOTS.TOP],
    group: GROUP.NONE,
  },
];

module.exports = ALL_CARDS;
