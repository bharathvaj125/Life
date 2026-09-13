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

export async function ensureShopSeeded() {
  const existing = await db.get('SELECT COUNT(*) as c FROM shop_items');
  if (Number(existing.c) === 0) {
    for (const it of items) {
      await db.run(
        `INSERT INTO shop_items (id, name, description, cost, category, icon) VALUES (?, ?, ?, ?, ?, ?)`,
        uuid(),
        it.name,
        it.description,
        it.cost,
        it.category,
        it.icon
      );
    }
    console.log(`Seeded ${items.length} Cyberpunk Black Market shop items.`);
    return items.length;
  }
  console.log('Shop already seeded, skipping.');
  return 0;
}

// Allow `npm run seed` to still work as a standalone script for local dev.
import { pathToFileURL } from 'url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  ensureShopSeeded()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
