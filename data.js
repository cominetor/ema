/* Seed data for RetroScaffale.
 * Each console has a signature "cartridge label" colour and a list of game
 * titles. Every game starts as "missing"; the user changes state by tapping.
 * Consoles/games are fully editable and persisted in localStorage afterwards.
 */
const SEED_CONSOLES = [
  {
    name: "NES",
    color: "#E4572E",
    games: [
      "Super Mario Bros. 3", "The Legend of Zelda", "Metroid", "Castlevania",
      "Mega Man 2", "Kirby's Adventure", "Punch-Out!!", "Contra",
      "Duck Tales", "Final Fantasy",
    ],
  },
  {
    name: "SNES",
    color: "#7A5CC6",
    games: [
      "Super Mario World", "The Legend of Zelda: A Link to the Past",
      "Super Metroid", "Chrono Trigger", "Donkey Kong Country",
      "Super Castlevania IV", "Final Fantasy VI", "EarthBound",
      "Super Mario RPG", "Star Fox",
    ],
  },
  {
    name: "N64",
    color: "#2E9E5B",
    games: [
      "Super Mario 64", "The Legend of Zelda: Ocarina of Time",
      "GoldenEye 007", "Banjo-Kazooie", "Paper Mario", "Super Smash Bros.",
      "Perfect Dark", "Conker's Bad Fur Day", "Majora's Mask", "Star Fox 64",
    ],
  },
  {
    name: "GameCube",
    color: "#5B6FD6",
    games: [
      "The Legend of Zelda: Wind Waker", "Metroid Prime",
      "Super Mario Sunshine", "Resident Evil 4", "Pikmin",
      "Super Smash Bros. Melee", "Paper Mario: The Thousand-Year Door",
      "Eternal Darkness", "Animal Crossing", "Luigi's Mansion",
    ],
  },
  {
    name: "Wii",
    color: "#37B6D9",
    games: [
      "Super Mario Galaxy", "The Legend of Zelda: Twilight Princess",
      "Super Smash Bros. Brawl", "Xenoblade Chronicles", "Metroid Prime 3",
      "Donkey Kong Country Returns", "Kirby's Epic Yarn",
      "Super Mario Galaxy 2", "Punch-Out!!", "No More Heroes",
    ],
  },
  {
    name: "Wii U",
    color: "#2C8FB0",
    games: [
      "Super Mario 3D World", "The Legend of Zelda: Breath of the Wild",
      "Splatoon", "Super Smash Bros. for Wii U", "Bayonetta 2",
      "Mario Kart 8", "Donkey Kong Country: Tropical Freeze", "Pikmin 3",
      "Xenoblade Chronicles X", "Captain Toad",
    ],
  },
  {
    name: "Switch",
    color: "#E8403F",
    games: [
      "The Legend of Zelda: Breath of the Wild", "Super Mario Odyssey",
      "Animal Crossing: New Horizons",
      "The Legend of Zelda: Tears of the Kingdom", "Metroid Dread",
      "Super Smash Bros. Ultimate", "Xenoblade Chronicles 3", "Splatoon 3",
      "Fire Emblem: Three Houses", "Bayonetta 3",
    ],
  },
  {
    name: "Game Boy / GBC / GBA",
    color: "#6FAE3F",
    games: [
      "Pokémon Rosso/Blu", "The Legend of Zelda: Link's Awakening",
      "Metroid II", "Pokémon Oro/Argento", "Super Mario Advance",
      "Metroid Fusion", "The Legend of Zelda: Minish Cap", "Golden Sun",
      "Castlevania: Aria of Sorrow", "Fire Emblem",
    ],
  },
  {
    name: "DS / 3DS",
    color: "#C0398B",
    games: [
      "The Legend of Zelda: Phantom Hourglass", "Pokémon Nero/Bianco",
      "Super Mario 64 DS", "Animal Crossing: Wild World",
      "The Legend of Zelda: Ocarina of Time 3D", "Pokémon X/Y",
      "Fire Emblem Awakening", "Super Mario 3D Land",
      "Kirby: Planet Robobot", "Metroid: Samus Returns",
    ],
  },
  {
    name: "PS1",
    color: "#556C99",
    games: [
      "Final Fantasy VII", "Metal Gear Solid", "Resident Evil 2",
      "Castlevania: Symphony of the Night", "Silent Hill", "Crash Bandicoot",
      "Spyro the Dragon", "Tekken 3", "Tomb Raider", "Chrono Cross",
    ],
  },
  {
    name: "PS2",
    color: "#2246A8",
    games: [
      "Metal Gear Solid 3", "Shadow of the Colossus", "God of War",
      "Final Fantasy X", "Devil May Cry", "Silent Hill 2", "Persona 4",
      "Kingdom Hearts", "Resident Evil 4", "Okami",
    ],
  },
  {
    name: "PSP",
    color: "#3D5A80",
    games: [
      "God of War: Chains of Olympus", "Crisis Core: Final Fantasy VII",
      "Persona 3 Portable", "Patapon", "LocoRoco",
      "Metal Gear Solid: Peace Walker", "Monster Hunter Freedom Unite",
      "Tactics Ogre: Let Us Cling Together",
    ],
  },
  {
    name: "Master System",
    color: "#B5322E",
    games: [
      "Alex Kidd in Miracle World", "Phantasy Star",
      "Wonder Boy in Monster Land", "Sonic the Hedgehog",
      "Golden Axe Warrior", "Ninja Gaiden",
    ],
  },
  {
    name: "Mega Drive / Genesis",
    color: "#C99A2E",
    games: [
      "Sonic the Hedgehog 2", "Streets of Rage 2", "Phantasy Star IV",
      "Castlevania: Bloodlines", "Gunstar Heroes", "Shining Force",
      "Golden Axe", "Ecco the Dolphin", "Vectorman", "Comix Zone",
    ],
  },
  {
    name: "Saturn",
    color: "#6D4C9F",
    games: [
      "Nights into Dreams", "Panzer Dragoon Saga", "Guardian Heroes",
      "Radiant Silvergun", "Shining Force III", "Fighters Megamix",
      "Virtua Fighter 2", "Dragon Force",
    ],
  },
  {
    name: "Dreamcast",
    color: "#E77E23",
    games: [
      "Shenmue", "Sonic Adventure", "Skies of Arcadia", "Jet Set Radio",
      "Grandia II", "Phantasy Star Online", "Resident Evil: Code Veronica",
      "Power Stone",
    ],
  },
  {
    name: "Game Gear",
    color: "#2A8F86",
    games: [],
  },
];
