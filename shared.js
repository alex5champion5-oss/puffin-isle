// =====================================================================
//  Puffin Isle — game data shared by the server and the browser
// =====================================================================
(function (root) {
  const COLORS = ['#2b6cd4', '#d43b3b', '#2fa84f', '#f2c12e', '#8e44ad', '#ff7f2a',
    '#ff6fb5', '#1abc9c', '#333344', '#8b5a2b', '#7fd3ff', '#a3e635'];

  // Wearable items: id -> [name, price]
  const ITEMS = {
    partyhat: ['Party Hat', 40], beanie: ['Cozy Beanie', 60], flower: ['Flower', 50], headphones: ['Headphones', 90],
    propeller: ['Propeller Cap', 120], tophat: ['Top Hat', 150], viking: ['Viking Helmet', 250], crown: ['Royal Crown', 400],
    sunglasses: ['Sunglasses', 80], scarf: ['Red Scarf', 70], bowtie: ['Bow Tie', 45],
  };

  // Furniture: id -> [name, price]
  const FURN = {
    chair: ['Wooden Chair', 30], stool: ['Bar Stool', 25], table: ['Round Table', 50], sofa: ['Comfy Sofa', 120],
    beanbag: ['Bean Bag', 60], bed: ['Cozy Bed', 150], lamp: ['Floor Lamp', 45], plant: ['Potted Plant', 30],
    bookshelf: ['Bookshelf', 90], tv: ['Big TV', 160], rug_red: ['Red Rug', 40], rug_blue: ['Blue Rug', 40],
    fireplace: ['Fireplace', 200], aquarium: ['Aquarium', 180], piano: ['Piano', 250], snowman: ['Snowman', 70],
    xmastree: ['Holiday Tree', 120], arcade: ['Arcade Machine', 220], fridge: ['Fridge', 100], fountain: ['Fountain', 260],
    discoball: ['Disco Ball', 150], trophy: ['Gold Trophy', 300], bench: ['Park Bench', 50], speaker: ['Speaker', 80],
  };
  const STARTER_FURN = { chair: 2, table: 1, lamp: 1, rug_red: 1 };

  const HOME_TYPES = { igloo: 'Igloo', cabin: 'Log Cabin', castle: 'Ice Castle' };
  const FLOORS = [
    ['Wood', '#b07a45'], ['Snow', '#f4faff'], ['Ice', '#bfe6ff'], ['Red Carpet', '#c0392b'], ['Blue Carpet', '#2e5fa8'],
    ['Grass', '#5cb85c'], ['Checkers', '#222222'], ['Pink Fluff', '#ff9fcf'], ['Sand', '#e8d29b'], ['Stone', '#8a8f99'],
  ];
  const WALLS = ['#f4faff', '#ffe0b2', '#c8e6c9', '#bbdefb', '#e1bee7', '#ffcdd2', '#fff59d', '#b2dfdb', '#d7ccc8', '#90a4ae', '#4a3b6b', '#2e3b4e'];

  const PUBLIC_ROOMS = ['town', 'cafe', 'club', 'shop', 'skihill', 'lodge', 'dock', 'fishhut', 'beach', 'lighthouse'];

  // Non-player characters: where they stand (world units) and how they look
  const NPCS = {
    mayor: { name: 'Mayor Waddles', room: 'town', x: -3, z: -3.5, color: '#333344', hat: 'tophat', hi: "Welcome to Puffin Isle! Our island always needs helpful puffins." },
    bea: { name: 'Barista Bea', room: 'cafe', x: 7, z: -7.6, color: '#8b5a2b', hat: 'beanie', hi: "Hot cocoa? Marshmallows? Both? Of course both." },
    flip: { name: 'DJ Flip', room: 'club', x: 0, z: -9, color: '#8e44ad', hat: 'headphones', hi: "Yo! The beat never stops on Puffin Isle!" },
    pip: { name: 'Shopkeeper Pip', room: 'shop', x: -5, z: -8, color: '#2fa84f', hat: 'bowtie', hi: "Fine hats, fine furniture, fine prices!" },
    slider: { name: 'Coach Slider', room: 'lodge', x: 10, z: -4, color: '#d43b3b', hat: 'beanie', hi: "Stretch those flippers! The hill waits for no puffin." },
    gull: { name: 'Captain Gull', room: 'fishhut', x: -8, z: -4, color: '#2b6cd4', hat: 'viking', hi: "Arr, the fish be bitin' today, matey." },
    lumi: { name: 'Keeper Lumi', room: 'lighthouse', x: -4, z: 1, color: '#f2c12e', hat: 'sunglasses', hi: "The light keeps every boat safe. Mind the stairs!" },
  };

  // Things to pick up for quests (only visible while you're on the quest)
  const COLLECT = {
    mitten1: { item: 'mitten', room: 'town', x: 13, z: 6.5 }, mitten2: { item: 'mitten', room: 'beach', x: -9, z: 6 },
    mitten3: { item: 'mitten', room: 'dock', x: 9, z: 7 }, mitten4: { item: 'mitten', room: 'skihill', x: -10, z: -2.5 },
    mitten5: { item: 'mitten', room: 'lodge', x: 11, z: 5 }, mitten6: { item: 'mitten', room: 'cafe', x: -7, z: 6.5 },
    bottle1: { item: 'bottle', room: 'beach', x: 5, z: 7.5 },
    oil1: { item: 'oil', room: 'fishhut', x: 7, z: 3 }, oil2: { item: 'oil', room: 'lodge', x: -11, z: 6 }, oil3: { item: 'oil', room: 'shop', x: 12, z: 6 },
  };
  const COLLECT_NAMES = { mitten: 'Lost Mitten', bottle: 'Message Bottle', oil: 'Lamp Oil' };

  // Quests. Objective types: talk, collect, game, dance, targets, visit, furniture, wear, hitplayer
  const QUESTS = [
    { id: 'welcome', title: 'A Warm Welcome', giver: 'mayor', turnIn: 'bea', req: [], lvl: 1,
      text: "Ahoy, newcomer! Every puffin on this island starts their day with a mug of cocoa. Waddle over to the Cocoa Café and say hello to Barista Bea. She's expecting you!",
      finish: "Oh, you must be the new puffin! Welcome, welcome. Here, have a cocoa on the house.",
      objs: [{ t: 'talk', npc: 'bea', n: 1, label: 'Find Barista Bea in the Cocoa Café' }], reward: { coins: 25, xp: 60 } },
    { id: 'cocoa', title: 'Cocoa Rush', giver: 'bea', turnIn: 'bea', req: ['welcome'], lvl: 1,
      text: "The morning rush is CHAOS. Mugs flying everywhere! Hop on the Cocoa Catch machine and show me you can catch 10 mugs in a single game.",
      finish: "Ten mugs and not a drop spilled! You're hired. Well... not really. But here's a tip!",
      objs: [{ t: 'game', game: 'catch', n: 10, label: 'Catch 10 mugs in one game of Cocoa Catch' }], reward: { coins: 50, xp: 100 } },
    { id: 'mittens', title: 'Lost Mittens', giver: 'mayor', turnIn: 'mayor', req: ['welcome'], lvl: 1,
      text: "Blast it all, the wind blew my mitten collection all over the island! Find 5 of my lost mittens. They're glowing a little, you can't miss them.",
      finish: "My mittens! My flippers were getting frosty. Take this scarf, it's the finest in town.",
      objs: [{ t: 'collect', item: 'mitten', n: 5, label: 'Lost Mittens found' }], reward: { coins: 70, xp: 150, item: 'scarf' } },
    { id: 'dance', title: 'Dance Fever', giver: 'flip', turnIn: 'flip', req: ['welcome'], lvl: 1,
      text: "This floor is too quiet! Get out there and DANCE for 20 seconds on the light-up floor. Press D or the 💃 button.",
      finish: "Now THAT'S what I call moves! The crowd loves you.",
      objs: [{ t: 'dance', n: 20, label: 'Seconds danced on the dance floor' }], reward: { coins: 40, xp: 100 } },
    { id: 'friends', title: 'Snowball Social', giver: 'flip', turnIn: 'flip', req: ['dance'], lvl: 2,
      text: "Best way to make friends on Puffin Isle? A friendly snowball to the face! Hit other puffins with 3 snowballs. Bring your friends along!",
      finish: "Ha! Everyone's laughing. That's the Puffin Isle spirit.",
      objs: [{ t: 'hitplayer', n: 3, label: 'Hit other puffins with snowballs' }], reward: { coins: 60, xp: 150 } },
    { id: 'targets', title: 'Target Practice', giver: 'slider', turnIn: 'slider', req: ['welcome'], lvl: 2,
      text: "Before you can race, you need a good throwing arm. I set up snowman targets out on Ski Hill. Hit them 5 times with snowballs (press T, then click).",
      finish: "Bullseye! You've got an arm like a cannon, kid.",
      objs: [{ t: 'targets', n: 5, label: 'Snowman targets hit' }], reward: { coins: 50, xp: 120 } },
    { id: 'downhill', title: 'Downhill Daredevil', giver: 'slider', turnIn: 'slider', req: ['targets'], lvl: 2,
      text: "Alright, rookie, time for the real thing. Take the Sled Race gate and slide 250 meters without wiping out three times.",
      finish: "250 meters! You're a natural. This trophy belongs in your home.",
      objs: [{ t: 'game', game: 'sled', n: 250, label: 'Sled 250 m in one Sled Race' }], reward: { coins: 80, xp: 180, furn: 'trophy' } },
    { id: 'fishing', title: "Gone Fishin'", giver: 'gull', turnIn: 'gull', req: ['welcome'], lvl: 2,
      text: "Arr, me fish bucket be empty! Drop a line through the ice hole and haul up 8 fish in one trip.",
      finish: "A fine haul! Here, take this aquarium for yer home. The fish in it are... decorative.",
      objs: [{ t: 'game', game: 'fish', n: 8, label: 'Catch 8 fish in one Ice Fishing trip' }], reward: { coins: 60, xp: 150, furn: 'aquarium' } },
    { id: 'bottle', title: 'Message in a Bottle', giver: 'gull', turnIn: 'lumi', req: ['fishing'], lvl: 2,
      text: "I spotted a bottle washin' up on Snowy Beach. Could be a message! Find it and bring it to Keeper Lumi up in the Lighthouse.",
      finish: "A message! It says... 'The light is running low.' Oh dear. I'll need your help again.",
      objs: [{ t: 'collect', item: 'bottle', n: 1, label: 'Find the bottle on Snowy Beach' },
        { t: 'talk', npc: 'lumi', n: 1, label: 'Bring it to Keeper Lumi in the Lighthouse' }], reward: { coins: 60, xp: 150 } },
    { id: 'oil', title: 'Light the Way', giver: 'lumi', turnIn: 'lumi', req: ['bottle'], lvl: 3,
      text: "The great lamp is running dry! I stored lamp oil cans all over the island: the Fishing Hut, the Ski Lodge and the Gift Shop. Bring me all 3!",
      finish: "The light shines bright again! Ships everywhere thank you. Take my spare headphones, I listen to sea shanties all night.",
      objs: [{ t: 'collect', item: 'oil', n: 3, label: 'Lamp oil cans collected' }], reward: { coins: 100, xp: 250, item: 'headphones' } },
    { id: 'fashion', title: 'Fashion Forward', giver: 'pip', turnIn: 'pip', req: ['welcome'], lvl: 1,
      text: "A puffin is nothing without style! Buy any item from my catalog and wear it. Open your bag 🎒 to put it on.",
      finish: "Stunning! Simply stunning. Come back anytime.",
      objs: [{ t: 'wear', n: 1, label: 'Wear an item' }], reward: { coins: 30, xp: 80 } },
    { id: 'home', title: 'Home Sweet Home', giver: 'pip', turnIn: 'pip', req: ['fashion'], lvl: 1,
      text: "Every puffin needs a cozy home! Go to your home (🏠 on the map), press ✏️ Edit, and place 3 pieces of furniture.",
      finish: "What a lovely home! Here, a bean bag for movie nights.",
      objs: [{ t: 'furniture', n: 3, label: 'Furniture placed in your home' }], reward: { coins: 60, xp: 150, furn: 'beanbag' } },
    { id: 'explorer', title: 'Island Explorer', giver: 'mayor', turnIn: 'mayor', req: ['mittens'], lvl: 3,
      text: "A true islander knows every corner of Puffin Isle. Visit all 10 places on the island, inside and out, then report back.",
      finish: "You've seen it all! By the power vested in me, I crown you an Honorary Islander. Literally, here's a crown.",
      objs: [{ t: 'visit', n: 10, label: 'Places visited' }], reward: { coins: 120, xp: 300, item: 'crown' } },
  ];
  const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

  function xpForLevel(L) { return 50 * L * (L - 1); }
  function levelFromXp(xp) { let L = 1; while (xp >= xpForLevel(L + 1)) L++; return L; }

  function newProg(q) { return { c: q.objs.map(() => 0), got: [], v: [] }; }
  // Current value of objective i (some are read from the account instead of progress)
  function objValue(q, i, prog, acct) {
    const o = q.objs[i];
    if (o.t === 'furniture') return Math.min(o.n, (acct.home && acct.home.items || []).length);
    if (o.t === 'wear') return acct.hat ? 1 : 0;
    if (o.t === 'collect') return Math.min(o.n, (prog.got || []).filter(id => COLLECT[id] && COLLECT[id].item === o.item).length);
    if (o.t === 'visit') return Math.min(o.n, (prog.v || []).length);
    return Math.min(o.n, (prog.c && prog.c[i]) || 0);
  }
  function questComplete(q, prog, acct) { return q.objs.every((o, i) => objValue(q, i, prog, acct) >= o.n); }
  // 'done' | 'ready' | 'active' | 'available' | 'locked'
  function questState(q, acct) {
    const qs = acct.quests || { active: {}, done: [] };
    if (qs.done.includes(q.id)) return 'done';
    if (qs.active[q.id]) return questComplete(q, qs.active[q.id], acct) ? 'ready' : 'active';
    if (q.req.every(r => qs.done.includes(r)) && levelFromXp(acct.xp || 0) >= q.lvl) return 'available';
    return 'locked';
  }
  function cleanProg(q, p) {
    const out = newProg(q);
    if (!p || typeof p !== 'object') return out;
    if (Array.isArray(p.c)) out.c = q.objs.map((_, i) => Math.max(0, Math.min(100000, Number(p.c[i]) || 0)));
    if (Array.isArray(p.got)) out.got = [...new Set(p.got.filter(id => COLLECT[id]))];
    if (Array.isArray(p.v)) out.v = [...new Set(p.v.filter(r => PUBLIC_ROOMS.includes(r)))];
    return out;
  }

  const S = { COLORS, ITEMS, FURN, STARTER_FURN, HOME_TYPES, FLOORS, WALLS, PUBLIC_ROOMS, NPCS, COLLECT, COLLECT_NAMES, QUESTS, QUEST_BY_ID,
    xpForLevel, levelFromXp, newProg, objValue, questComplete, questState, cleanProg };
  if (typeof module !== 'undefined' && module.exports) module.exports = S; else root.S = S;
})(typeof window !== 'undefined' ? window : globalThis);
