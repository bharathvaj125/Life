import { v4 as uuid } from 'uuid';
import db from './index.js';

const items = [
  {
    name: 'Neural Interface MK-II',
    description: 'A cybernetic implant that enhances reflex processing and displays neural uplink HUD overlay.',
    cost: 80,
    category: 'implant',
    icon: 'cpu',
  },
  {
    name: 'Tactical Holo-Visor',
    description: 'Military-grade ocular enhancement that scans mission vectors with cyan wireframe highlights.',
    cost: 120,
    category: 'cosmetic',
    icon: 'glasses',
  },
  {
    name: 'Night City Matrix OS',
    description: 'A dark synthwave desktop theme with deep void tones and vibrant magenta accents.',
    cost: 200,
    category: 'theme',
    icon: 'monitor',
  },
  {
    name: 'Quantum Streak Battery',
    description: 'Emergency failsafe power cell that protects your active streak against system downtime.',
    cost: 150,
    category: 'consumable',
    icon: 'battery-charging',
  },
  {
    name: 'Subdermal Carbon Weave',
    description: 'Reinforced cyber-dermal mesh giving your avatar an armored street-samurai profile.',
    cost: 250,
    category: 'armor',
    icon: 'shield',
  },
  {
    name: 'Uplink XP Overclock Shard',
    description: 'Data chip injecting hyper-threaded focus routines, increasing mission yields.',
    cost: 100,
    category: 'consumable',
    icon: 'zap',
  },
  {
    name: 'Glitch Drone Companion',
    description: 'A floating holographic recon drone that hums with neon static around your command terminal.',
    cost: 350,
    category: 'companion',
    icon: 'bot',
  },
  {
    name: 'Arasaka Executive Badge',
    description: 'High-clearance encrypted VIP token that unlocks exclusive status flair.',
    cost: 500,
    category: 'badge',
    icon: 'award',
  },
];

const insert = db.prepare(
  `INSERT OR IGNORE INTO shop_items (id, name, description, cost, category, icon) VALUES (?, ?, ?, ?, ?, ?)`
);
const existing = db.prepare('SELECT COUNT(*) as c FROM shop_items').get();

if (existing.c === 0) {
  const tx = db.transaction((rows) => {
    for (const it of rows) insert.run(uuid(), it.name, it.description, it.cost, it.category, it.icon);
  });
  tx(items);
  console.log(`Seeded ${items.length} Cyberpunk Black Market shop items.`);
} else {
  console.log('Shop already seeded, skipping.');
}
