
// =========================================================================
// WARDROBE & DUCK ITEMS DATABASE
// =========================================================================
const PALETTES = {
  body: [
    { id: 'yellow', name: 'Buttercup Yellow', body: '#ffe043', belly: '#fff39e', stroke: '#cf9b00' },
    { id: 'pink', name: 'Bubblegum Pink', body: '#ffb3cc', belly: '#ffe3ee', stroke: '#d6678c' },
    { id: 'mint', name: 'Mint Sorbet', body: '#90ecd1', belly: '#dcfaee', stroke: '#42ab8c' },
    { id: 'lavender', name: 'Soft Lavender', body: '#d3b5ff', belly: '#efe3ff', stroke: '#8d5ee3' },
    { id: 'blue', name: 'Baby Blue', body: '#96d4ff', belly: '#dff1ff', stroke: '#4292d6' },
    { id: 'white', name: 'Cloud White', body: '#f6f8fb', belly: '#ffffff', stroke: '#9ea8b8' },
    { id: 'peach', name: 'Warm Peach', body: '#ffc4a3', belly: '#ffe7db', stroke: '#d97d4c' },
    { id: 'cocoa', name: 'Cocoa Brown', body: '#9e7554', belly: '#d9b89c', stroke: '#593c26' }
  ],
  beak: [
    { id: 'orange', name: 'Sunny Orange', beak: '#ff9d24', stroke: '#c46a00' },
    { id: 'coral', name: 'Coral Pink', beak: '#ff6b7e', stroke: '#c42f44' },
    { id: 'lemon', name: 'Golden Lemon', beak: '#ffbe26', stroke: '#b87b00' },
    { id: 'berry', name: 'Sweet Berry', beak: '#d6497a', stroke: '#8f1f46' }
  ],
  eyes: [
    { id: 'normal', name: 'Sparkly Eyes', icon: '👀' },
    { id: 'wink', name: 'Cheeky Wink', icon: '😉' },
    { id: 'star', name: 'Starry Eyes', icon: '🤩' },
    { id: 'heart', name: 'Heart Eyes', icon: '😍' }
  ]
};

const ITEMS = {
  clothes: [
    {
      id: 'none',
      name: 'Natural Feather',
      icon: '🪶',
      previewBox: '120 230 160 170',
      svg: ''
    },
    {
      id: 'chef',
      name: 'Chef Coat',
      icon: '👨‍🍳',
      previewBox: '120 230 160 160',
      svg: `
        <!-- Chef Coat -->
        <path d="M148,235 C125,260 115,295 120,335 C125,372 155,385 200,385 C245,385 275,372 280,335 C285,295 275,260 252,235 C230,248 170,248 148,235 Z" fill="#ffffff" stroke="#c4cbd6" stroke-width="4" stroke-linejoin="round"/>
        <!-- Red Neckerchief -->
        <path d="M175,232 C185,242 200,245 200,245 C200,245 215,242 225,232 C210,246 190,246 175,232 Z" fill="#ff4d6a" stroke="#d62444" stroke-width="2.5"/>
        <path d="M194,242 L188,272 L202,265 L208,270 L204,242 Z" fill="#ff4d6a" stroke="#d62444" stroke-width="2"/>
        <!-- Double-breasted buttons -->
        <circle cx="178" cy="285" r="4.5" fill="#2d3748"/>
        <circle cx="212" cy="285" r="4.5" fill="#2d3748"/>
        <circle cx="178" cy="315" r="4.5" fill="#2d3748"/>
        <circle cx="212" cy="315" r="4.5" fill="#2d3748"/>
        <circle cx="178" cy="345" r="4.5" fill="#2d3748"/>
        <circle cx="212" cy="345" r="4.5" fill="#2d3748"/>
      `
    },
    {
      id: 'rockstar',
      name: 'Rocker Leather Jacket',
      icon: '🎸',
      previewBox: '115 230 170 165',
      svg: `
        <!-- Rocker Red Shirt -->
        <path d="M152,238 C140,265 135,310 145,370 C165,385 235,385 255,370 C265,310 260,265 248,238 Z" fill="#ff2a4b"/>
        <!-- Black Leather Jacket -->
        <path d="M148,235 C122,260 112,295 118,335 C122,368 140,380 165,382 L172,310 L160,245 Z" fill="#242229" stroke="#121017" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M252,235 C278,260 288,295 282,335 C278,368 260,380 235,382 L228,310 L240,245 Z" fill="#242229" stroke="#121017" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Silver Studs and Zippers -->
        <circle cx="150" cy="265" r="3" fill="#e2e8f0"/>
        <circle cx="156" cy="285" r="3" fill="#e2e8f0"/>
        <circle cx="250" cy="265" r="3" fill="#e2e8f0"/>
        <circle cx="244" cy="285" r="3" fill="#e2e8f0"/>
        <line x1="172" y1="310" x2="165" y2="382" stroke="#e2e8f0" stroke-width="2.5" stroke-dasharray="3,2"/>
      `
    },
    {
      id: 'doctor',
      name: 'Doctor Scrubs',
      icon: '🩺',
      previewBox: '120 230 160 160',
      svg: `
        <!-- Mint Scrubs -->
        <path d="M148,235 C125,260 115,295 120,335 C125,372 155,385 200,385 C245,385 275,372 280,335 C285,295 275,260 252,235 C235,248 165,248 148,235 Z" fill="#5eead4" stroke="#0d9488" stroke-width="4" stroke-linejoin="round"/>
        <!-- V-Neck -->
        <path d="M175,232 L200,268 L225,232 Z" fill="#99f6e4" stroke="#0d9488" stroke-width="2.5"/>
        <!-- Pocket with Pen -->
        <rect x="150" y="295" width="22" height="26" rx="4" fill="#2dd4bf" stroke="#0d9488" stroke-width="2"/>
        <line x1="156" y1="288" x2="156" y2="300" stroke="#0369a1" stroke-width="3" stroke-linecap="round"/>
        <!-- Stethoscope -->
        <path d="M170,230 C165,270 175,330 200,340 C225,330 235,270 230,230" fill="none" stroke="#334155" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="200" cy="340" r="7" fill="#cbd5e1" stroke="#475569" stroke-width="2.5"/>
      `
    },
    {
      id: 'scuba',
      name: 'Scuba Diving Suit',
      icon: '🤿',
      previewBox: '115 230 170 165',
      svg: `
        <!-- Neoprene Wetsuit -->
        <path d="M148,235 C122,260 115,295 120,338 C125,375 155,386 200,386 C245,386 275,375 280,338 C285,295 278,260 252,235 C230,248 170,248 148,235 Z" fill="#0284c7" stroke="#0369a1" stroke-width="4" stroke-linejoin="round"/>
        <!-- Yellow Side Accent Panels -->
        <path d="M132,275 C128,305 130,345 142,370 C132,365 124,345 122,320 Z" fill="#facc15"/>
        <path d="M268,275 C272,305 270,345 258,370 C268,365 276,345 278,320 Z" fill="#facc15"/>
        <!-- Diving Harness -->
        <line x1="165" y1="240" x2="165" y2="385" stroke="#0f172a" stroke-width="4"/>
        <line x1="235" y1="240" x2="235" y2="385" stroke="#0f172a" stroke-width="4"/>
        <rect x="180" y="310" width="40" height="18" rx="4" fill="#0f172a"/>
        <rect x="192" y="313" width="16" height="12" rx="2" fill="#e2e8f0"/>
      `
    },
    {
      id: 'sweater',
      name: 'Cozy Knit Sweater',
      icon: '🧶',
      previewBox: '115 230 170 165',
      svg: `
        <!-- Chunky Knit Striped Sweater -->
        <path d="M146,234 C120,260 112,295 116,335 C122,375 150,388 200,388 C250,388 278,375 284,335 C288,295 280,260 254,234 Z" fill="#f472b6" stroke="#db2777" stroke-width="4" stroke-linejoin="round"/>
        <!-- Stripes -->
        <path d="M125,270 C165,278 235,278 275,270 L277,290 C235,298 165,298 123,290 Z" fill="#fef08a"/>
        <path d="M120,310 C165,320 235,320 280,310 L281,330 C235,340 165,340 119,330 Z" fill="#a7f3d0"/>
        <path d="M122,348 C165,358 235,358 278,348 L276,366 C235,376 165,376 124,366 Z" fill="#bae6fd"/>
        <!-- Neck Ribbing -->
        <path d="M148,234 C175,246 225,246 252,234 C245,248 155,248 148,234 Z" fill="#db2777"/>
      `
    },
    {
      id: 'overalls',
      name: 'Denim Overalls',
      icon: '👖',
      previewBox: '120 230 160 165',
      svg: `
        <!-- Yellow Undershirt -->
        <path d="M148,235 C125,260 118,295 120,335 C125,372 155,385 200,385 C245,385 275,372 280,335 C285,295 275,260 252,235 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>
        <!-- Denim Body -->
        <path d="M145,295 C145,295 160,295 200,295 C240,295 255,295 255,295 C275,320 272,365 255,385 C235,392 165,392 145,385 C128,365 125,320 145,295 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="4" stroke-linejoin="round"/>
        <!-- Straps with Buckles -->
        <line x1="162" y1="240" x2="162" y2="300" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>
        <line x1="238" y1="240" x2="238" y2="300" stroke="#2563eb" stroke-width="9" stroke-linecap="round"/>
        <circle cx="162" cy="298" r="5" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
        <circle cx="238" cy="298" r="5" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
        <!-- Front Pocket -->
        <rect x="180" y="325" width="40" height="32" rx="4" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>
        <path d="M192,336 L208,336" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/>
      `
    },
    {
      id: 'tuxedo',
      name: 'Fancy Tuxedo',
      icon: '🤵',
      previewBox: '120 230 160 165',
      svg: `
        <!-- White Dress Shirt -->
        <path d="M148,235 C125,260 115,295 120,335 C125,372 155,385 200,385 C245,385 275,372 280,335 C285,295 275,260 252,235 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
        <!-- Red Bow Tie -->
        <path d="M185,236 L198,245 L185,254 Z" fill="#e11d48"/>
        <path d="M215,236 L202,245 L215,254 Z" fill="#e11d48"/>
        <circle cx="200" cy="245" r="4" fill="#be123c"/>
        <!-- Tuxedo Jacket Lapels -->
        <path d="M146,236 C135,270 138,340 165,380 L195,310 L165,248 Z" fill="#18181b" stroke="#09090b" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M254,236 C265,270 262,340 235,380 L205,310 L235,248 Z" fill="#18181b" stroke="#09090b" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Gold Buttons -->
        <circle cx="200" cy="330" r="3.5" fill="#facc15"/>
        <circle cx="200" cy="355" r="3.5" fill="#facc15"/>
      `
    },
    {
      id: 'wizard',
      name: 'Celestial Wizard Robe',
      icon: '🧙‍♂️',
      previewBox: '110 230 180 170',
      svg: `
        <!-- Purple Robe -->
        <path d="M145,234 C115,265 105,320 112,382 C145,395 255,395 288,382 C295,320 285,265 255,234 C230,248 170,248 145,234 Z" fill="#6b21a8" stroke="#4c1d95" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Gold Trim -->
        <path d="M145,234 L192,388 L208,388 L255,234" fill="none" stroke="#fbbf24" stroke-width="4"/>
        <!-- Gold Moons and Stars -->
        <path d="M145,330 A8,8 0 0 1 152,342 A10,10 0 1 0 145,330 Z" fill="#fde047"/>
        <path d="M250,335 A8,8 0 0 1 257,347 A10,10 0 1 0 250,335 Z" fill="#fde047"/>
        <polygon points="175,360 177,366 183,366 178,370 180,376 175,372 170,376 172,370 167,366 173,366" fill="#fde047"/>
        <polygon points="225,360 227,366 233,366 228,370 230,376 225,372 220,376 222,370 217,366 223,366" fill="#fde047"/>
      `
    },
    {
      id: 'dress',
      name: 'Pastel Flower Sundress',
      icon: '👗',
      previewBox: '120 230 160 165',
      svg: `
        <!-- Pink Floral Sundress -->
        <path d="M165,245 C150,270 130,325 125,378 C155,392 245,392 275,378 C270,325 250,270 235,245 C215,255 185,255 165,245 Z" fill="#fda4af" stroke="#f43f5e" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Frilly White Lace Hem -->
        <path d="M125,378 Q135,388 145,380 Q155,390 165,382 Q175,392 185,384 Q195,394 205,385 Q215,395 225,385 Q235,393 245,384 Q255,392 265,382 Q275,388 275,378" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Ditsy Daisies -->
        <circle cx="160" cy="300" r="3.5" fill="#ffffff"/><circle cx="160" cy="300" r="1.5" fill="#facc15"/>
        <circle cx="230" cy="310" r="3.5" fill="#ffffff"/><circle cx="230" cy="310" r="1.5" fill="#facc15"/>
        <circle cx="185" cy="340" r="3.5" fill="#ffffff"/><circle cx="185" cy="340" r="1.5" fill="#facc15"/>
        <circle cx="215" cy="355" r="3.5" fill="#ffffff"/><circle cx="215" cy="355" r="1.5" fill="#facc15"/>
        <!-- Sweet Ribbon Bow -->
        <path d="M190,250 L200,255 L190,260 Z" fill="#fb7185"/>
        <path d="M210,250 L200,255 L210,260 Z" fill="#fb7185"/>
        <circle cx="200" cy="255" r="3.5" fill="#e11d48"/>
      `
    },
    {
      id: 'hoodie',
      name: 'Oversized Pastel Hoodie',
      icon: '🧥',
      previewBox: '115 230 170 165',
      svg: `
        <!-- Lavender Hoodie -->
        <path d="M145,232 C118,260 110,295 116,335 C122,375 150,388 200,388 C250,388 278,375 284,335 C290,295 282,260 255,232 C230,248 170,248 145,232 Z" fill="#c084fc" stroke="#9333ea" stroke-width="4" stroke-linejoin="round"/>
        <!-- Kangaroo Pocket -->
        <path d="M158,335 L242,335 L234,372 L166,372 Z" fill="#a855f7" stroke="#7e22ce" stroke-width="2.5"/>
        <!-- Drawstrings -->
        <line x1="185" y1="244" x2="182" y2="280" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <line x1="215" y1="244" x2="218" y2="280" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
        <circle cx="182" cy="282" r="3" fill="#cbd5e1"/>
        <circle cx="218" cy="282" r="3" fill="#cbd5e1"/>
      `
    },
    {
      id: 'cowboy',
      name: 'Western Fringe Vest',
      icon: '🤠',
      previewBox: '120 230 160 165',
      svg: `
        <!-- Plaid Shirt -->
        <path d="M148,235 C125,260 115,295 120,335 C125,372 155,385 200,385 C245,385 275,372 280,335 C285,295 275,260 252,235 Z" fill="#fed7aa"/>
        <!-- Red Bandana -->
        <polygon points="175,232 200,265 225,232" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
        <!-- Brown Fringe Vest -->
        <path d="M146,236 C135,270 136,340 160,375 L182,310 L162,246 Z" fill="#92400e" stroke="#78350f" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M254,236 C265,270 264,340 240,375 L218,310 L238,246 Z" fill="#92400e" stroke="#78350f" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Sheriff Star Badge -->
        <polygon points="160,290 162,295 167,295 163,298 165,303 160,300 155,303 157,298 153,295 158,295" fill="#facc15" stroke="#b45309" stroke-width="1"/>
      `
    }
  ],

  hats: [
    {
      id: 'none',
      name: 'No Hat',
      icon: '❌',
      previewBox: '100 40 200 120',
      svg: ''
    },
    {
      id: 'chef',
      name: 'Chef Toque',
      icon: '🧑‍🍳',
      previewBox: '120 30 160 110',
      svg: `
        <!-- Tall Puffy Chef Hat -->
        <path d="M152,105 C130,105 120,70 142,50 C140,25 175,15 195,30 C215,10 255,20 258,50 C280,68 268,105 248,105 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="4" stroke-linejoin="round"/>
        <!-- Hat Band -->
        <rect x="150" y="96" width="100" height="22" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="3.5"/>
        <!-- Pleat lines -->
        <path d="M170,45 C172,70 172,96 172,96" stroke="#e2e8f0" stroke-width="2.5"/>
        <path d="M200,32 C200,60 200,96 200,96" stroke="#e2e8f0" stroke-width="2.5"/>
        <path d="M230,45 C228,70 228,96 228,96" stroke="#e2e8f0" stroke-width="2.5"/>
      `
    },
    {
      id: 'rockstar',
      name: 'Rocker Bandana & Spikes',
      icon: '🎸',
      previewBox: '120 50 160 100',
      svg: `
        <!-- Punk Spiky Hair -->
        <polygon points="190,85 195,45 205,80" fill="#18181b"/>
        <polygon points="202,80 215,35 220,82" fill="#18181b"/>
        <polygon points="215,82 232,50 228,88" fill="#18181b"/>
        <polygon points="175,90 180,55 192,86" fill="#18181b"/>
        <!-- Red Flame Bandana -->
        <path d="M130,105 C150,92 250,92 270,105 C265,122 135,122 130,105 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Flame pattern -->
        <path d="M145,102 Q155,94 165,104 Q175,94 185,104 Q195,94 205,104 Q215,94 225,104 Q235,94 245,104 Q255,94 265,102" fill="none" stroke="#facc15" stroke-width="3"/>
        <!-- Knot tie -->
        <polygon points="128,105 118,118 126,118" fill="#dc2626"/>
      `
    },
    {
      id: 'nurse',
      name: 'Nurse Cap',
      icon: '🩺',
      previewBox: '130 50 140 90',
      svg: `
        <!-- Nurse Cap -->
        <path d="M150,110 L160,70 L240,70 L250,110 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M146,110 Q200,102 254,110" fill="none" stroke="#0ea5e9" stroke-width="4"/>
        <!-- Red Cross -->
        <rect x="194" y="80" width="12" height="20" fill="#ef4444"/>
        <rect x="190" y="84" width="20" height="12" fill="#ef4444"/>
      `
    },
    {
      id: 'snorkel',
      name: 'Snorkel Tube',
      icon: '🤿',
      previewBox: '110 50 180 100',
      svg: `
        <!-- Snorkel Tube wrapped around head -->
        <path d="M260,165 C285,165 292,120 290,65 L278,65 C280,115 275,155 258,155 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3"/>
        <!-- Orange Top Splashtrap -->
        <rect x="272" y="55" width="22" height="14" rx="3" fill="#f97316" stroke="#c2410c" stroke-width="2"/>
        <!-- Strap -->
        <path d="M130,145 Q200,135 270,145" fill="none" stroke="#0f172a" stroke-width="4"/>
      `
    },
    {
      id: 'party',
      name: 'Party Cone Hat',
      icon: '🎉',
      previewBox: '130 15 140 120',
      svg: `
        <!-- Party Hat Cone -->
        <polygon points="152,110 200,28 248,110" fill="#f472b6" stroke="#db2777" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Colorful Stripes -->
        <polygon points="166,85 200,28 184,85" fill="#facc15"/>
        <polygon points="186,85 200,28 204,85" fill="#38bdf8"/>
        <polygon points="206,85 200,28 224,85" fill="#4ade80"/>
        <!-- Golden Pom-Pom -->
        <circle cx="200" cy="26" r="9" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
      `
    },
    {
      id: 'wizard',
      name: 'Star Wizard Hat',
      icon: '🔮',
      previewBox: '100 10 200 130',
      svg: `
        <!-- Wide Brim -->
        <ellipse cx="200" cy="112" rx="72" ry="16" fill="#4c1d95" stroke="#311068" stroke-width="3.5"/>
        <!-- Pointy Cone with crooked top -->
        <path d="M152,108 C165,70 180,45 220,18 C205,38 215,70 248,108 Z" fill="#6b21a8" stroke="#311068" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Gold Buckle Band -->
        <rect x="156" y="98" width="88" height="12" fill="#f59e0b"/>
        <rect x="192" y="94" width="16" height="20" rx="3" fill="none" stroke="#fef08a" stroke-width="3"/>
        <!-- Hanging Gold Star -->
        <polygon points="222,18 224,24 230,24 225,28 227,34 222,30 217,34 219,28 214,24 220,24" fill="#fde047"/>
      `
    },
    {
      id: 'beret',
      name: 'Artist Red Beret',
      icon: '🎨',
      previewBox: '120 50 160 90',
      svg: `
        <!-- Tilted French Beret -->
        <ellipse cx="200" cy="98" rx="65" ry="22" transform="rotate(-8 200 98)" fill="#dc2626" stroke="#991b1b" stroke-width="3.5"/>
        <!-- Beret Stem -->
        <line x1="198" y1="78" x2="196" y2="70" stroke="#991b1b" stroke-width="3.5" stroke-linecap="round"/>
      `
    },
    {
      id: 'sailor',
      name: 'Sailor Dixie Cap',
      icon: '⚓',
      previewBox: '125 45 150 95',
      svg: `
        <!-- White Sailor Hat with Turned-Up Brim -->
        <path d="M148,110 C140,82 260,82 252,110 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3.5"/>
        <path d="M140,112 C135,92 265,92 260,112 C255,122 145,122 140,112 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>
        <!-- Blue Anchor -->
        <circle cx="200" cy="94" r="3" fill="none" stroke="#0284c7" stroke-width="2"/>
        <line x1="200" y1="97" x2="200" y2="107" stroke="#0284c7" stroke-width="2"/>
        <path d="M194,103 C196,108 204,108 206,103" fill="none" stroke="#0284c7" stroke-width="2"/>
      `
    },
    {
      id: 'cowboy',
      name: 'Western Cowboy Hat',
      icon: '🤠',
      previewBox: '100 40 200 100',
      svg: `
        <!-- Curled Brim -->
        <path d="M110,118 C120,95 280,95 290,118 C270,126 130,126 110,118 Z" fill="#b45309" stroke="#78350f" stroke-width="4" stroke-linejoin="round"/>
        <!-- Indented Crown -->
        <path d="M152,108 C150,75 168,68 185,75 C195,68 205,68 215,75 C232,68 250,75 248,108 Z" fill="#d97706" stroke="#78350f" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Dark Leather Band -->
        <path d="M152,106 Q200,98 248,106" fill="none" stroke="#451a03" stroke-width="5"/>
      `
    },
    {
      id: 'frog',
      name: 'Froggy Bucket Hat',
      icon: '🐸',
      previewBox: '115 40 170 100',
      svg: `
        <!-- Frog Eyes on Top -->
        <circle cx="165" cy="65" r="14" fill="#4ade80" stroke="#16a34a" stroke-width="3"/>
        <circle cx="165" cy="65" r="7" fill="#ffffff"/>
        <circle cx="165" cy="65" r="3.5" fill="#14532d"/>
        <circle cx="235" cy="65" r="14" fill="#4ade80" stroke="#16a34a" stroke-width="3"/>
        <circle cx="235" cy="65" r="7" fill="#ffffff"/>
        <circle cx="235" cy="65" r="3.5" fill="#14532d"/>
        <!-- Bucket Crown -->
        <path d="M148,110 L156,75 L244,75 L252,110 Z" fill="#86efac" stroke="#16a34a" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Flared Brim -->
        <path d="M130,118 C150,108 250,108 270,118 L256,110 C240,106 160,106 144,110 Z" fill="#4ade80" stroke="#16a34a" stroke-width="3" stroke-linejoin="round"/>
      `
    },
    {
      id: 'crown',
      name: 'Royal Golden Crown',
      icon: '👑',
      previewBox: '125 45 150 90',
      svg: `
        <!-- 5-Point Gold Crown -->
        <polygon points="145,110 148,65 172,85 200,50 228,85 252,65 255,110" fill="#facc15" stroke="#ca8a04" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Gemstones -->
        <circle cx="200" cy="52" r="5" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
        <circle cx="148" cy="67" r="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
        <circle cx="252" cy="67" r="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
        <ellipse cx="200" cy="100" rx="4" ry="5" fill="#10b981"/>
      `
    },
    {
      id: 'flower',
      name: 'Daisy Flower Crown',
      icon: '🌸',
      previewBox: '120 70 160 70',
      svg: `
        <!-- Vine -->
        <path d="M135,115 Q200,98 265,115" fill="none" stroke="#22c55e" stroke-width="4"/>
        <!-- Daisies -->
        <g transform="translate(145, 110)">
          <circle cx="0" cy="0" r="8" fill="#ffffff"/>
          <circle cx="0" cy="0" r="3.5" fill="#facc15"/>
        </g>
        <g transform="translate(172, 102)">
          <circle cx="0" cy="0" r="9" fill="#f472b6"/>
          <circle cx="0" cy="0" r="3.5" fill="#fef08a"/>
        </g>
        <g transform="translate(200, 98)">
          <circle cx="0" cy="0" r="10" fill="#ffffff"/>
          <circle cx="0" cy="0" r="4" fill="#facc15"/>
        </g>
        <g transform="translate(228, 102)">
          <circle cx="0" cy="0" r="9" fill="#a7f3d0"/>
          <circle cx="0" cy="0" r="3.5" fill="#fef08a"/>
        </g>
        <g transform="translate(255, 110)">
          <circle cx="0" cy="0" r="8" fill="#ffffff"/>
          <circle cx="0" cy="0" r="3.5" fill="#facc15"/>
        </g>
      `
    },
    {
      id: 'eggshell',
      name: 'Cracked Eggshell & Sprout',
      icon: '🌱',
      previewBox: '130 40 140 100',
      svg: `
        <!-- Green Sprout -->
        <path d="M198,65 Q190,40 180,48 Q188,60 198,65" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
        <path d="M202,65 Q212,38 222,46 Q214,58 202,65" fill="#4ade80" stroke="#15803d" stroke-width="2"/>
        <!-- Cracked Shell -->
        <path d="M152,108 C150,75 250,75 248,108 L232,96 L216,108 L200,94 L184,108 L168,96 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="3.5" stroke-linejoin="round"/>
      `
    },
    {
      id: 'tophat',
      name: 'Silk Top Hat',
      icon: '🎩',
      previewBox: '120 30 160 115',
      svg: `
        <!-- Brim -->
        <ellipse cx="200" cy="112" rx="60" ry="14" fill="#18181b" stroke="#09090b" stroke-width="3"/>
        <!-- Crown -->
        <path d="M162,110 L165,42 L235,42 L238,110 Z" fill="#27272a" stroke="#09090b" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Red Silk Ribbon -->
        <rect x="162" y="96" width="76" height="14" fill="#ef4444"/>
      `
    }
  ],

  glasses: [
    {
      id: 'none',
      name: 'No Glasses',
      icon: '❌',
      previewBox: '120 135 160 80',
      svg: ''
    },
    {
      id: 'thug',
      name: 'Pixel Thug Shades',
      icon: '😎',
      previewBox: '130 140 140 60',
      svg: `
        <!-- Pixel Sunglasses -->
        <rect x="140" y="148" width="45" height="24" fill="#000000"/>
        <rect x="215" y="148" width="45" height="24" fill="#000000"/>
        <rect x="185" y="152" width="30" height="8" fill="#000000"/>
        <!-- Pixel White Glare -->
        <rect x="144" y="152" width="6" height="6" fill="#ffffff"/>
        <rect x="150" y="158" width="6" height="6" fill="#ffffff"/>
        <rect x="219" y="152" width="6" height="6" fill="#ffffff"/>
        <rect x="225" y="158" width="6" height="6" fill="#ffffff"/>
      `
    },
    {
      id: 'round',
      name: 'Round Gold Glasses',
      icon: '👓',
      previewBox: '125 135 150 70',
      svg: `
        <!-- Left Lens -->
        <circle cx="160" cy="160" r="22" fill="rgba(255, 255, 255, 0.45)" stroke="#eab308" stroke-width="3.5"/>
        <!-- Right Lens -->
        <circle cx="240" cy="160" r="22" fill="rgba(255, 255, 255, 0.45)" stroke="#eab308" stroke-width="3.5"/>
        <!-- Bridge -->
        <path d="M182,158 Q200,150 218,158" fill="none" stroke="#eab308" stroke-width="3.5"/>
        <!-- Side temples -->
        <line x1="138" y1="158" x2="124" y2="152" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>
        <line x1="262" y1="158" x2="276" y2="152" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>
      `
    },
    {
      id: 'cateye',
      name: 'Retro Cat-Eye Shades',
      icon: '🕶️',
      previewBox: '120 135 160 70',
      svg: `
        <!-- Pink Cat-Eye Frame -->
        <path d="M130,145 L182,156 C182,176 150,185 140,172 Z" fill="#ec4899" stroke="#be185d" stroke-width="3"/>
        <path d="M270,145 L218,156 C218,176 250,185 260,172 Z" fill="#ec4899" stroke="#be185d" stroke-width="3"/>
        <line x1="182" y1="156" x2="218" y2="156" stroke="#be185d" stroke-width="3.5"/>
        <!-- Dark Lenses -->
        <path d="M138,152 L176,158 C176,172 152,178 144,168 Z" fill="#374151"/>
        <path d="M262,152 L224,158 C224,172 248,178 256,168 Z" fill="#374151"/>
        <!-- Sparkle Gems -->
        <circle cx="132" cy="148" r="2.5" fill="#ffffff"/>
        <circle cx="268" cy="148" r="2.5" fill="#ffffff"/>
      `
    },
    {
      id: 'scuba',
      name: 'Diving Goggles',
      icon: '🥽',
      previewBox: '125 135 150 70',
      svg: `
        <!-- Scuba Mask Oval Frame -->
        <path d="M138,145 C170,140 230,140 262,145 C275,160 270,185 240,186 C215,186 200,178 185,186 C155,186 125,185 138,145 Z" fill="rgba(56, 189, 248, 0.4)" stroke="#0284c7" stroke-width="5" stroke-linejoin="round"/>
        <!-- Nose Pocket -->
        <path d="M190,178 Q200,186 210,178" fill="none" stroke="#0284c7" stroke-width="3"/>
        <!-- Glass Glare -->
        <path d="M152,150 L168,175" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <path d="M232,150 L248,175" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      `
    },
    {
      id: 'heart',
      name: 'Heart Sunglasses',
      icon: '💖',
      previewBox: '125 135 150 70',
      svg: `
        <!-- Left Heart -->
        <path d="M162,155 A12,12 0 0,0 142,165 C142,180 162,192 162,192 C162,192 182,180 182,165 A12,12 0 0,0 162,155 Z" fill="#f43f5e" stroke="#be123c" stroke-width="3"/>
        <!-- Right Heart -->
        <path d="M238,155 A12,12 0 0,0 218,165 C218,180 238,192 238,192 C238,192 258,180 258,165 A12,12 0 0,0 238,155 Z" fill="#f43f5e" stroke="#be123c" stroke-width="3"/>
        <!-- Bridge -->
        <line x1="182" y1="166" x2="218" y2="166" stroke="#be123c" stroke-width="3"/>
      `
    },
    {
      id: 'star',
      name: 'Festival Star Shades',
      icon: '⭐',
      previewBox: '125 135 150 70',
      svg: `
        <!-- Left Star -->
        <polygon points="160,140 165,155 180,155 168,164 172,178 160,170 148,178 152,164 140,155 155,155" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Right Star -->
        <polygon points="240,140 245,155 260,155 248,164 252,178 240,170 228,178 232,164 220,155 235,155" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
        <line x1="180" y1="155" x2="220" y2="155" stroke="#ca8a04" stroke-width="3"/>
      `
    },
    {
      id: 'monocle',
      name: 'Gentleman Monocle',
      icon: '🧐',
      previewBox: '140 135 120 70',
      svg: `
        <!-- Gold Monocle on right eye -->
        <circle cx="238" cy="160" r="20" fill="rgba(255, 255, 255, 0.45)" stroke="#f59e0b" stroke-width="3.5"/>
        <!-- Hanging chain -->
        <path d="M258,160 Q270,190 260,225" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="2,2"/>
      `
    },
    {
      id: 'blush',
      name: 'Anime Blush & Band-Aid',
      icon: '🩹',
      previewBox: '130 160 140 60',
      svg: `
        <!-- Cheek Sparkle Stickers -->
        <polygon points="135,180 136,184 140,185 136,186 135,190 134,186 130,185 134,184" fill="#fb7185"/>
        <polygon points="265,180 266,184 270,185 266,186 265,190 264,186 260,185 264,184" fill="#fb7185"/>
        <!-- Cute Nose Band-Aid -->
        <rect x="186" y="172" width="28" height="12" rx="4" transform="rotate(-6 200 178)" fill="#fed7aa" stroke="#fb923c" stroke-width="1.5"/>
        <circle cx="200" cy="178" r="2.5" fill="#fb7185"/>
      `
    },
    {
      id: 'mustache',
      name: 'Dapper Handlebar Mustache',
      icon: '🥸',
      previewBox: '150 190 100 45',
      svg: `
        <!-- Curled Mustache below beak -->
        <path d="M200,215 C185,212 165,212 155,224 C162,228 178,225 195,220 C200,220 205,220 205,220 C222,225 238,228 245,224 C235,212 215,212 200,215 Z" fill="#27272a" stroke="#09090b" stroke-width="2"/>
      `
    }
  ],

  props: [
    {
      id: 'none',
      name: 'Empty Wings',
      icon: '❌',
      previewBox: '260 250 120 120',
      svg: ''
    },
    {
      id: 'guitar',
      name: 'Electric Rock Guitar',
      icon: '🎸',
      previewBox: '260 250 120 120',
      svg: `
        <!-- Electric Guitar Body -->
        <g transform="translate(260, 260) rotate(-22)">
          <!-- Neck -->
          <rect x="45" y="-30" width="10" height="90" fill="#fed7aa" stroke="#78350f" stroke-width="2"/>
          <rect x="42" y="-45" width="16" height="18" rx="2" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
          <!-- Body -->
          <path d="M30,55 C20,45 60,35 70,55 C80,75 75,100 50,105 C25,100 20,75 30,55 Z" fill="#ef4444" stroke="#991b1b" stroke-width="3" stroke-linejoin="round"/>
          <ellipse cx="50" cy="75" rx="16" ry="20" fill="#ffffff"/>
          <!-- Strings -->
          <line x1="50" y1="-30" x2="50" y2="85" stroke="#e2e8f0" stroke-width="1.5"/>
        </g>
      `
    },
    {
      id: 'spoon',
      name: 'Wooden Chef Spoon',
      icon: '🥄',
      previewBox: '260 250 120 120',
      svg: `
        <g transform="translate(290, 260) rotate(-25)">
          <!-- Handle -->
          <rect x="8" y="0" width="8" height="95" rx="4" fill="#d97706" stroke="#92400e" stroke-width="2"/>
          <!-- Bowl -->
          <ellipse cx="12" cy="0" rx="15" ry="22" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
          <!-- Droplet -->
          <circle cx="12" cy="-4" r="5" fill="#f59e0b"/>
        </g>
      `
    },
    {
      id: 'wand',
      name: 'Magic Star Wand',
      icon: '🪄',
      previewBox: '260 240 120 120',
      svg: `
        <g transform="translate(295, 250) rotate(-18)">
          <!-- Wand shaft -->
          <line x1="10" y1="20" x2="10" y2="105" stroke="#f472b6" stroke-width="5" stroke-linecap="round"/>
          <polygon points="10,0 14,14 28,14 17,23 21,36 10,28 -1,36 3,23 -8,14 6,14" fill="#facc15" stroke="#ca8a04" stroke-width="2.5"/>
          <!-- Sparkles -->
          <circle cx="32" cy="5" r="3" fill="#ffffff"/>
          <circle cx="-5" cy="40" r="2.5" fill="#ffffff"/>
        </g>
      `
    },
    {
      id: 'boba',
      name: 'Boba Milk Tea',
      icon: '🧋',
      previewBox: '270 270 100 110',
      svg: `
        <g transform="translate(285, 285)">
          <!-- Straw -->
          <line x1="28" y1="-12" x2="20" y2="25" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
          <!-- Cup -->
          <path d="M5,10 L35,10 L30,68 C30,75 10,75 10,68 Z" fill="#fed7aa" stroke="#b45309" stroke-width="3" stroke-linejoin="round"/>
          <!-- Domed Lid -->
          <path d="M3,10 Q20,-2 37,10 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <!-- Tapioca Pearls -->
          <circle cx="14" cy="62" r="4" fill="#451a03"/>
          <circle cx="24" cy="63" r="4" fill="#451a03"/>
          <circle cx="19" cy="56" r="4" fill="#451a03"/>
        </g>
      `
    },
    {
      id: 'lollipop',
      name: 'Rainbow Swirl Lollipop',
      icon: '🍭',
      previewBox: '270 240 100 120',
      svg: `
        <g transform="translate(295, 250) rotate(-15)">
          <!-- Stick -->
          <rect x="18" y="40" width="6" height="70" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5"/>
          <!-- Lollipop Spiral -->
          <circle cx="21" cy="22" r="24" fill="#f43f5e" stroke="#be123c" stroke-width="2"/>
          <path d="M21,22 A18,18 0 0 1 35,32 A12,12 0 0 1 20,34 A6,6 0 0 1 21,22" fill="none" stroke="#fef08a" stroke-width="5" stroke-linecap="round"/>
          <path d="M21,22 A12,12 0 0 1 28,12 A6,6 0 0 1 21,22" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        </g>
      `
    },
    {
      id: 'balloon',
      name: 'Pink Heart Balloon',
      icon: '🎈',
      previewBox: '270 210 110 150',
      svg: `
        <g transform="translate(280, 220)">
          <!-- Heart Balloon -->
          <path d="M35,25 A14,14 0 0,0 12,38 C12,56 35,72 35,72 C35,72 58,56 58,38 A14,14 0 0,0 35,25 Z" fill="#f43f5e" stroke="#e11d48" stroke-width="3"/>
          <!-- Highlight -->
          <ellipse cx="24" cy="36" rx="4" ry="7" transform="rotate(-25 24 36)" fill="#ffffff" opacity="0.75"/>
          <!-- Balloon String -->
          <path d="M35,72 Q38,90 32,108 Q38,120 35,135" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        </g>
      `
    },
    {
      id: 'teddy',
      name: 'Cuddly Teddy Bear',
      icon: '🧸',
      previewBox: '270 270 100 110',
      svg: `
        <g transform="translate(285, 280)">
          <!-- Ears -->
          <circle cx="10" cy="12" r="7" fill="#92400e"/>
          <circle cx="34" cy="12" r="7" fill="#92400e"/>
          <!-- Head -->
          <circle cx="22" cy="20" r="15" fill="#b45309" stroke="#78350f" stroke-width="2"/>
          <!-- Body -->
          <ellipse cx="22" cy="46" rx="16" ry="18" fill="#b45309" stroke="#78350f" stroke-width="2"/>
          <!-- Snout & Eyes -->
          <ellipse cx="22" cy="23" rx="7" ry="5" fill="#fde68a"/>
          <circle cx="22" cy="21" r="2.5" fill="#451a03"/>
          <circle cx="16" cy="18" r="2" fill="#451a03"/>
          <circle cx="28" cy="18" r="2" fill="#451a03"/>
          <!-- Bow -->
          <polygon points="17,33 22,35 17,37" fill="#ef4444"/>
          <polygon points="27,33 22,35 27,37" fill="#ef4444"/>
        </g>
      `
    },
    {
      id: 'trophy',
      name: 'Golden Champion Cup',
      icon: '🏆',
      previewBox: '270 270 100 110',
      svg: `
        <g transform="translate(285, 275)">
          <!-- Cup Body -->
          <path d="M8,10 L36,10 C36,36 8,36 8,10 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- Handles -->
          <path d="M8,15 C-2,15 -2,28 8,28" fill="none" stroke="#ca8a04" stroke-width="3"/>
          <path d="M36,15 C46,15 46,28 36,28" fill="none" stroke="#ca8a04" stroke-width="3"/>
          <!-- Stem and Base -->
          <rect x="19" y="36" width="6" height="14" fill="#eab308"/>
          <rect x="12" y="50" width="20" height="10" rx="2" fill="#78350f"/>
          <!-- Star on cup -->
          <polygon points="22,17 23,21 27,21 24,24 25,28 22,25 19,28 20,24 17,21 21,21" fill="#ffffff"/>
        </g>
      `
    },
    {
      id: 'camera',
      name: 'Vintage Pastel Camera',
      icon: '📷',
      previewBox: '270 270 100 110',
      svg: `
        <g transform="translate(280, 280)">
          <!-- Camera Strap -->
          <path d="M-5,-10 Q20,-2 45,-10" fill="none" stroke="#334155" stroke-width="2"/>
          <!-- Camera Body -->
          <rect x="0" y="10" width="48" height="34" rx="6" fill="#a7f3d0" stroke="#059669" stroke-width="2.5"/>
          <rect x="10" y="5" width="12" height="6" fill="#059669"/>
          <!-- Lens -->
          <circle cx="24" cy="27" r="11" fill="#334155" stroke="#0f172a" stroke-width="2"/>
          <circle cx="24" cy="27" r="6" fill="#38bdf8"/>
          <circle cx="22" cy="25" r="2" fill="#ffffff"/>
        </g>
      `
    },
    {
      id: 'clipboard',
      name: 'Doctor Clipboard',
      icon: '📋',
      previewBox: '270 270 100 110',
      svg: `
        <g transform="translate(285, 275) rotate(-10)">
          <!-- Board -->
          <rect x="5" y="10" width="36" height="48" rx="4" fill="#92400e" stroke="#78350f" stroke-width="2"/>
          <!-- Paper -->
          <rect x="9" y="16" width="28" height="38" fill="#ffffff"/>
          <line x1="13" y1="26" x2="28" y2="26" stroke="#94a3b8" stroke-width="2"/>
          <line x1="13" y1="33" x2="31" y2="33" stroke="#94a3b8" stroke-width="2"/>
          <line x1="13" y1="40" x2="25" y2="40" stroke="#94a3b8" stroke-width="2"/>
          <!-- Metal Clip -->
          <rect x="17" y="7" width="12" height="8" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
        </g>
      `
    }
  ],

  shoes: [
    {
      id: 'none',
      name: 'Bare Webbed Feet',
      icon: '❌',
      previewBox: '100 370 200 90',
      svg: ''
    },
    {
      id: 'sneakers',
      name: 'Retro Red Sneakers',
      icon: '👟',
      previewBox: '100 380 200 70',
      svg: `
        <!-- Left Sneaker -->
        <g transform="translate(112, 388)">
          <path d="M8,12 L38,12 L48,26 L4,26 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="2" y="24" width="48" height="8" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
          <circle cx="42" cy="22" r="5" fill="#ffffff"/>
          <!-- White Laces -->
          <line x1="22" y1="16" x2="30" y2="16" stroke="#ffffff" stroke-width="2"/>
          <line x1="24" y1="20" x2="32" y2="20" stroke="#ffffff" stroke-width="2"/>
        </g>
        <!-- Right Sneaker -->
        <g transform="translate(236, 388)">
          <path d="M4,12 L34,12 L48,26 L4,26 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="2" y="24" width="48" height="8" rx="3" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
          <circle cx="12" cy="22" r="5" fill="#ffffff"/>
          <!-- White Laces -->
          <line x1="18" y1="16" x2="26" y2="16" stroke="#ffffff" stroke-width="2"/>
          <line x1="20" y1="20" x2="28" y2="20" stroke="#ffffff" stroke-width="2"/>
        </g>
      `
    },
    {
      id: 'rainboots',
      name: 'Yellow Puddle Boots',
      icon: '👢',
      previewBox: '100 375 200 75',
      svg: `
        <!-- Left Yellow Boot -->
        <g transform="translate(115, 376)">
          <path d="M12,0 L32,0 L32,24 L48,32 L48,40 L4,40 L4,24 L12,24 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>
          <rect x="2" y="36" width="48" height="6" rx="2" fill="#713f12"/>
        </g>
        <!-- Right Yellow Boot -->
        <g transform="translate(238, 376)">
          <path d="M20,0 L40,0 L40,24 L48,24 L48,40 L4,40 L4,32 L20,24 Z" fill="#facc15" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>
          <rect x="2" y="36" width="48" height="6" rx="2" fill="#713f12"/>
        </g>
      `
    },
    {
      id: 'flippers',
      name: 'Scuba Diving Flippers',
      icon: '🤿',
      previewBox: '85 380 230 80',
      svg: `
        <!-- Left Long Flipper -->
        <path d="M142,392 C135,402 105,420 85,424 C100,428 140,428 155,422 C165,424 178,422 182,416 C175,405 165,395 158,390 Z" fill="#06b6d4" stroke="#0891b2" stroke-width="3" stroke-linejoin="round"/>
        <!-- Right Long Flipper -->
        <path d="M242,390 C235,395 225,405 218,416 C222,422 235,424 245,422 C260,428 300,428 315,424 C295,420 265,402 258,392 Z" fill="#06b6d4" stroke="#0891b2" stroke-width="3" stroke-linejoin="round"/>
      `
    },
    {
      id: 'rollers',
      name: 'Retro Roller Skates',
      icon: '🛼',
      previewBox: '100 380 200 75',
      svg: `
        <!-- Left Skate -->
        <g transform="translate(112, 386)">
          <path d="M8,8 L36,8 L46,20 L4,20 Z" fill="#f472b6" stroke="#db2777" stroke-width="2.5"/>
          <rect x="4" y="19" width="44" height="4" fill="#475569"/>
          <circle cx="12" cy="27" r="6" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
          <circle cx="38" cy="27" r="6" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
          <circle cx="48" cy="22" r="3" fill="#fb7185"/>
        </g>
        <!-- Right Skate -->
        <g transform="translate(236, 386)">
          <path d="M4,8 L32,8 L44,20 L2,20 Z" fill="#f472b6" stroke="#db2777" stroke-width="2.5"/>
          <rect x="2" y="19" width="44" height="4" fill="#475569"/>
          <circle cx="10" cy="27" r="6" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
          <circle cx="36" cy="27" r="6" fill="#a855f7" stroke="#6b21a8" stroke-width="2"/>
          <circle cx="46" cy="22" r="3" fill="#fb7185"/>
        </g>
      `
    },
    {
      id: 'slippers',
      name: 'Fluffy Bunny Slippers',
      icon: '🐰',
      previewBox: '100 380 200 70',
      svg: `
        <!-- Left Bunny Slipper -->
        <g transform="translate(110, 388)">
          <!-- Bunny Face -->
          <ellipse cx="26" cy="18" rx="24" ry="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5"/>
          <!-- Ears -->
          <ellipse cx="14" cy="4" rx="5" ry="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="14" cy="4" rx="2.5" ry="5" fill="#f472b6"/>
          <ellipse cx="28" cy="3" rx="5" ry="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="28" cy="3" rx="2.5" ry="5" fill="#f472b6"/>
          <!-- Nose -->
          <circle cx="38" cy="18" r="2.5" fill="#f43f5e"/>
        </g>
        <!-- Right Bunny Slipper -->
        <g transform="translate(240, 388)">
          <!-- Bunny Face -->
          <ellipse cx="24" cy="18" rx="24" ry="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5"/>
          <!-- Ears -->
          <ellipse cx="22" cy="3" rx="5" ry="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="22" cy="3" rx="2.5" ry="5" fill="#f472b6"/>
          <ellipse cx="36" cy="4" rx="5" ry="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="36" cy="4" rx="2.5" ry="5" fill="#f472b6"/>
          <!-- Nose -->
          <circle cx="12" cy="18" r="2.5" fill="#f43f5e"/>
        </g>
      `
    }
  ],

  backgrounds: [
    {
      id: 'bedroom',
      name: 'Cozy Bedroom Studio',
      icon: '🛋️',
      theme: 'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #e0f2fe 100%)',
      wallColor: '#fce7f3',
      floorColor: '#e9d5ff'
    },
    {
      id: 'pond',
      name: 'Sunny Duck Pond',
      icon: '🪷',
      theme: 'linear-gradient(180deg, #bae6fd 0%, #e0f2fe 45%, #86efac 70%, #4ade80 100%)',
      wallColor: '#bae6fd',
      floorColor: '#86efac'
    },
    {
      id: 'kitchen',
      name: 'Pastel Bakery',
      icon: '🧁',
      theme: 'linear-gradient(180deg, #fef3c7 0%, #ffedd5 50%, #fed7aa 100%)',
      wallColor: '#fef3c7',
      floorColor: '#fed7aa'
    },
    {
      id: 'stage',
      name: 'Rock Concert Stage',
      icon: '🎤',
      theme: 'linear-gradient(180deg, #312e81 0%, #4c1d95 60%, #1e1b4b 100%)',
      wallColor: '#312e81',
      floorColor: '#1e1b4b'
    },
    {
      id: 'beach',
      name: 'Tropical Beach',
      icon: '🏖️',
      theme: 'linear-gradient(180deg, #7dd3fc 0%, #bae6fd 50%, #fef08a 85%, #fde047 100%)',
      wallColor: '#7dd3fc',
      floorColor: '#fde047'
    },
    {
      id: 'cloud',
      name: 'Rainbow Cloudland',
      icon: '🌈',
      theme: 'linear-gradient(180deg, #fbcfe8 0%, #fef08a 35%, #bfdbfe 70%, #e9d5ff 100%)',
      wallColor: '#fbcfe8',
      floorColor: '#e9d5ff'
    }
  ]
};


// =========================================================================
// SOUND ENGINE (SYNTHESIZED WEB AUDIO API)
// =========================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('duck_sound') !== 'false';
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tone(freq, dur = 0.15, type = 'sine', vol = 0.2) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (_) {}
  }

  pop() {
    this.init();
    this.tone(380 + Math.random() * 80, 0.08, 'triangle', 0.22);
  }

  equip() {
    this.init();
    this.tone(440, 0.1, 'sine', 0.2);
    setTimeout(() => this.tone(660, 0.14, 'sine', 0.2), 50);
  }

  unequip() {
    this.init();
    this.tone(550, 0.09, 'sine', 0.18);
    setTimeout(() => this.tone(330, 0.12, 'sine', 0.15), 50);
  }

  color() {
    this.init();
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'triangle', 0.14), i * 50));
  }

  fanfare() {
    this.init();
    const freqs = [440, 554, 659, 880, 1108];
    freqs.forEach((f, i) => setTimeout(() => this.tone(f, 0.22, 'triangle', 0.18), i * 75));
  }

  camera() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    try {
      // Noise burst for mechanical shutter
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
      setTimeout(() => this.tone(900, 0.06, 'sine', 0.15), 60);
    } catch (_) {}
  }

  reset() {
    this.init();
    this.tone(400, 0.1, 'sine', 0.18);
    setTimeout(() => this.tone(260, 0.15, 'sine', 0.14), 70);
  }
}

const sound = new SoundEngine();

// =========================================================================
// GAME STATE & MANAGEMENT
// =========================================================================
class DressUpGame {
  constructor() {
    this.state = this.loadState();
    this.activeTab = 'clothes';
    this.dom = {
      app: document.getElementById('app'),
      mainMenu: document.getElementById('screenMainMenu'),
      duckSvg: document.getElementById('duckSvg'),
      stageBg: document.getElementById('stageBg'),
      duckDropZone: document.getElementById('duckDropZone'),
      itemsGrid: document.getElementById('itemsGrid'),
      categoryTabs: document.getElementById('categoryTabs'),
      screenFlash: document.getElementById('screenFlash'),
      dragGhost: document.getElementById('dragGhost'),
      fxLayer: document.getElementById('fxLayer'),
      toast: document.getElementById('toast'),
      slots: {
        clothes: document.getElementById('slot-clothes'),
        hats: document.getElementById('slot-hats'),
        glasses: document.getElementById('slot-glasses'),
        props: document.getElementById('slot-props'),
        shoes: document.getElementById('slot-shoes'),
        back: document.getElementById('slot-back')
      }
    };

    this.dragItem = null;
    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem('duck_outfit_save');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      bodyColor: 'yellow',
      beakColor: 'orange',
      eyes: 'normal',
      clothes: 'chef',
      hats: 'chef',
      glasses: 'none',
      props: 'spoon',
      shoes: 'none',
      backgrounds: 'kitchen'
    };
  }

  saveState() {
    try {
      localStorage.setItem('duck_outfit_save', JSON.stringify(this.state));
    } catch (_) {}
  }

  init() {
    this.applyDuckColors();
    this.applyEyes();
    this.applyEquippedItems();
    this.applyBackground();
    this.renderDrawer();
    this.bindEvents();
    this.bindDragDrop();
  }

  applyDuckColors() {
    const b = PALETTES.body.find(x => x.id === this.state.bodyColor) || PALETTES.body[0];
    const k = PALETTES.beak.find(x => x.id === this.state.beakColor) || PALETTES.beak[0];

    document.documentElement.style.setProperty('--duck-body', b.body);
    document.documentElement.style.setProperty('--duck-belly', b.belly);
    document.documentElement.style.setProperty('--duck-stroke', b.stroke);
    document.documentElement.style.setProperty('--duck-beak', k.beak);
    document.documentElement.style.setProperty('--duck-beak-stroke', k.stroke);
    document.documentElement.style.setProperty('--duck-feet', k.beak);
    document.documentElement.style.setProperty('--duck-feet-stroke', k.stroke);
  }

  applyEyes() {
    const eyesGroup = document.getElementById('duck-eyes');
    if (!eyesGroup) return;

    if (this.state.eyes === 'wink') {
      eyesGroup.innerHTML = `
        <!-- Left eye normal -->
        <ellipse cx="162" cy="160" rx="11" ry="14" fill="#241a22"/>
        <circle cx="158" cy="156" r="4.5" fill="#ffffff"/><circle cx="165" cy="163" r="2.2" fill="#ffffff"/>
        <!-- Right eye winking -->
        <path d="M226,162 Q238,150 250,162" fill="none" stroke="#241a22" stroke-width="4" stroke-linecap="round"/>
      `;
    } else if (this.state.eyes === 'star') {
      eyesGroup.innerHTML = `
        <polygon points="162,148 165,158 175,158 167,164 170,174 162,168 154,174 157,164 149,158 159,158" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
        <polygon points="238,148 241,158 251,158 243,164 246,174 238,168 230,174 233,164 225,158 235,158" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
      `;
    } else if (this.state.eyes === 'heart') {
      eyesGroup.innerHTML = `
        <path d="M162,152 A8,8 0 0,0 148,160 C148,172 162,180 162,180 C162,180 176,172 176,160 A8,8 0 0,0 162,152 Z" fill="#f43f5e"/>
        <path d="M238,152 A8,8 0 0,0 224,160 C224,172 238,180 238,180 C238,180 252,172 252,160 A8,8 0 0,0 238,152 Z" fill="#f43f5e"/>
      `;
    } else {
      eyesGroup.innerHTML = `
        <ellipse cx="162" cy="160" rx="11" ry="14" fill="#241a22"/>
        <circle cx="158" cy="156" r="4.5" fill="#ffffff"/><circle cx="165" cy="163" r="2.2" fill="#ffffff"/>
        <ellipse cx="238" cy="160" rx="11" ry="14" fill="#241a22"/>
        <circle cx="234" cy="156" r="4.5" fill="#ffffff"/><circle cx="241" cy="163" r="2.2" fill="#ffffff"/>
      `;
    }
  }

  applyEquippedItems() {
    ['clothes', 'hats', 'glasses', 'props', 'shoes'].forEach(cat => {
      const itemId = this.state[cat];
      const slot = this.dom.slots[cat];
      if (!slot) return;

      const item = (ITEMS[cat] || []).find(x => x.id === itemId);
      slot.innerHTML = (item && item.id !== 'none') ? item.svg : '';
    });
  }

  applyBackground() {
    const bg = ITEMS.backgrounds.find(x => x.id === this.state.backgrounds) || ITEMS.backgrounds[0];
    if (this.dom.stageBg) {
      this.dom.stageBg.style.background = bg.theme;
    }
  }

  equip(category, itemId) {
    if (category === 'colors') return;

    if (category === 'backgrounds') {
      this.state.backgrounds = itemId;
      this.applyBackground();
      sound.pop();
      this.saveState();
      this.renderDrawer();
      return;
    }

    if (this.state[category] === itemId && itemId !== 'none') {
      // Toggle off / unequip
      this.state[category] = 'none';
      sound.unequip();
    } else {
      this.state[category] = itemId;
      sound.equip();
      this.triggerSquish();
      this.emitSparkles(200, 240);
    }

    this.applyEquippedItems();
    this.saveState();
    this.renderDrawer();
  }

  triggerSquish() {
    this.dom.duckSvg.classList.remove('duck-squish');
    void this.dom.duckSvg.offsetWidth;
    this.dom.duckSvg.classList.add('duck-squish');
  }

  emitSparkles(x, y, count = 10) {
    const cols = ['#f472b6', '#facc15', '#38bdf8', '#4ade80', '#c084fc'];
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      const rad = 25 + Math.random() * 45;
      const angle = Math.random() * Math.PI * 2;
      const sz = 6 + Math.random() * 8;
      s.style.width = sz + 'px';
      s.style.height = sz + 'px';
      s.style.background = cols[i % cols.length];
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', (Math.cos(angle) * rad) + 'px');
      s.style.setProperty('--dy', (Math.sin(angle) * rad) + 'px');
      this.dom.fxLayer.appendChild(s);
      setTimeout(() => s.remove(), 750);
    }
  }

  renderDrawer() {
    const cat = this.activeTab;
    const grid = this.dom.itemsGrid;
    grid.innerHTML = '';

    if (cat === 'colors') {
      // Switch grid to block so the color drawer controls its own layout
      grid.style.display = 'block';
      this.renderColorDrawer(grid);
      return;
    }

    // Restore normal grid for all other categories
    grid.style.display = '';
    const items = ITEMS[cat] || [];
    items.forEach(item => {
      const card = document.createElement('div');
      const isEquipped = this.state[cat] === item.id;
      card.className = 'item-card ' + (isEquipped ? 'equipped' : '');
      card.dataset.cat = cat;
      card.dataset.id = item.id;

      let previewSvg = '';
      if (item.id === 'none') {
        previewSvg = '<div style="font-size:32px;">' + item.icon + '</div>';
      } else {
        previewSvg = `
          <svg viewBox="${item.previewBox || '0 0 400 460'}">
            ${item.svg}
          </svg>
        `;
      }

      card.innerHTML = `
        <div class="item-preview">${previewSvg}</div>
        <div class="item-name">${item.name}</div>
        ${isEquipped ? '<div class="badge-equipped">✓</div>' : ''}
      `;

      card.onclick = () => this.equip(cat, item.id);
      grid.appendChild(card);
    });
  }

  renderColorDrawer(container) {
    // Two-column layout: Body Color | Beak & Feet Color
    const colsWrap = document.createElement('div');
    colsWrap.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:4px;';

    // ---- Body column ----
    const colBody = document.createElement('div');
    const titleBody = document.createElement('div');
    titleBody.className = 'color-section-title';
    titleBody.textContent = 'Body Color:';
    colBody.appendChild(titleBody);
    const swatchesBody = document.createElement('div');
    swatchesBody.className = 'color-swatches';
    PALETTES.body.forEach(pal => {
      const btn = document.createElement('button');
      btn.className = 'swatch-btn ' + (this.state.bodyColor === pal.id ? 'active' : '');
      btn.style.background = pal.body;
      btn.title = pal.name;
      btn.onclick = () => {
        this.state.bodyColor = pal.id;
        this.applyDuckColors();
        sound.color();
        this.saveState();
        this.renderDrawer();
      };
      swatchesBody.appendChild(btn);
    });
    colBody.appendChild(swatchesBody);
    colsWrap.appendChild(colBody);

    // ---- Beak column ----
    const colBeak = document.createElement('div');
    const titleBeak = document.createElement('div');
    titleBeak.className = 'color-section-title';
    titleBeak.textContent = 'Beak & Feet:';
    colBeak.appendChild(titleBeak);
    const swatchesBeak = document.createElement('div');
    swatchesBeak.className = 'color-swatches';
    PALETTES.beak.forEach(pal => {
      const btn = document.createElement('button');
      btn.className = 'swatch-btn ' + (this.state.beakColor === pal.id ? 'active' : '');
      btn.style.background = pal.beak;
      btn.title = pal.name;
      btn.onclick = () => {
        this.state.beakColor = pal.id;
        this.applyDuckColors();
        sound.color();
        this.saveState();
        this.renderDrawer();
      };
      swatchesBeak.appendChild(btn);
    });
    colBeak.appendChild(swatchesBeak);
    colsWrap.appendChild(colBeak);

    container.appendChild(colsWrap);

    // ---- Eye Expression row (horizontal scroll) ----
    const titleEyes = document.createElement('div');
    titleEyes.className = 'color-section-title';
    titleEyes.textContent = 'Eye Expression:';
    container.appendChild(titleEyes);

    const eyesRow = document.createElement('div');
    eyesRow.className = 'eye-expr-row';
    PALETTES.eyes.forEach(exp => {
      const btn = document.createElement('button');
      btn.className = 'eye-expr-btn' + (this.state.eyes === exp.id ? ' active' : '');
      btn.innerHTML = '<span>' + exp.icon + '</span><span>' + exp.name + '</span>';
      btn.onclick = () => {
        this.state.eyes = exp.id;
        this.applyEyes();
        sound.pop();
        this.saveState();
        this.renderDrawer();
      };
      eyesRow.appendChild(btn);
    });
    container.appendChild(eyesRow);
  }

  randomizeOutfit() {
    ['clothes', 'hats', 'glasses', 'props', 'shoes'].forEach(cat => {
      const pool = ITEMS[cat] || [];
      const chosen = pool[(Math.random() * pool.length) | 0];
      this.state[cat] = chosen ? chosen.id : 'none';
    });

    const b = PALETTES.body[(Math.random() * PALETTES.body.length) | 0];
    const k = PALETTES.beak[(Math.random() * PALETTES.beak.length) | 0];
    const e = PALETTES.eyes[(Math.random() * PALETTES.eyes.length) | 0];
    const bg = ITEMS.backgrounds[(Math.random() * ITEMS.backgrounds.length) | 0];

    this.state.bodyColor = b.id;
    this.state.beakColor = k.id;
    this.state.eyes = e.id;
    this.state.backgrounds = bg.id;

    this.applyDuckColors();
    this.applyEyes();
    this.applyEquippedItems();
    this.applyBackground();
    this.renderDrawer();
    this.saveState();

    sound.fanfare();
    this.triggerSquish();
    this.emitSparkles(200, 220, 25);
    showToast('Surprise! New outfit created! ✨');
  }

  resetOutfit() {
    this.state.clothes = 'none';
    this.state.hats = 'none';
    this.state.glasses = 'none';
    this.state.props = 'none';
    this.state.shoes = 'none';
    this.state.bodyColor = 'yellow';
    this.state.beakColor = 'orange';
    this.state.eyes = 'normal';

    this.applyDuckColors();
    this.applyEyes();
    this.applyEquippedItems();
    this.renderDrawer();
    this.saveState();

    sound.reset();
    this.triggerSquish();
    showToast('Outfit reset to natural duckling! 🐥');
  }

  takePhoto() {
    sound.camera();

    // Trigger visual camera flash
    this.dom.screenFlash.classList.add('flash');
    setTimeout(() => this.dom.screenFlash.classList.remove('flash'), 120);

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    const bgDef = ITEMS.backgrounds.find(x => x.id === this.state.backgrounds) || ITEMS.backgrounds[0];
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
    if (bgDef.id === 'stage') {
      bgGrad.addColorStop(0, '#312e81');
      bgGrad.addColorStop(0.65, '#4c1d95');
      bgGrad.addColorStop(1, '#1e1b4b');
    } else if (bgDef.id === 'beach') {
      bgGrad.addColorStop(0, '#7dd3fc');
      bgGrad.addColorStop(0.5, '#bae6fd');
      bgGrad.addColorStop(0.85, '#fef08a');
      bgGrad.addColorStop(1, '#fde047');
    } else if (bgDef.id === 'pond') {
      bgGrad.addColorStop(0, '#bae6fd');
      bgGrad.addColorStop(0.5, '#e0f2fe');
      bgGrad.addColorStop(0.7, '#86efac');
      bgGrad.addColorStop(1, '#4ade80');
    } else {
      bgGrad.addColorStop(0, '#fce7f3');
      bgGrad.addColorStop(0.5, '#ede9fe');
      bgGrad.addColorStop(1, '#e0f2fe');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(40, 40, 920, 960);

    // Decorative inner frame
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(55, 55, 890, 930);

    // 2. Render Duck SVG into Image and draw on canvas
    const svgClone = this.dom.duckSvg.cloneNode(true);
    // Replace CSS variables with explicit computed hex colors so canvas renders accurately
    const bodyHex = getComputedStyle(document.documentElement).getPropertyValue('--duck-body').trim() || '#ffe043';
    const bellyHex = getComputedStyle(document.documentElement).getPropertyValue('--duck-belly').trim() || '#fff39e';
    const strokeHex = getComputedStyle(document.documentElement).getPropertyValue('--duck-stroke').trim() || '#cf9b00';
    const beakHex = getComputedStyle(document.documentElement).getPropertyValue('--duck-beak').trim() || '#ff9d24';
    const beakStroke = getComputedStyle(document.documentElement).getPropertyValue('--duck-beak-stroke').trim() || '#c46a00';

    let svgStr = new XMLSerializer().serializeToString(svgClone);
    svgStr = svgStr.replace(/var(--duck-body)/g, bodyHex)
                   .replace(/var(--duck-belly)/g, bellyHex)
                   .replace(/var(--duck-stroke)/g, strokeHex)
                   .replace(/var(--duck-beak)/g, beakHex)
                   .replace(/var(--duck-beak-stroke)/g, beakStroke)
                   .replace(/var(--duck-feet)/g, beakHex)
                   .replace(/var(--duck-feet-stroke)/g, beakStroke);

    const img = new Image();
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Draw Duck centered
      ctx.drawImage(img, 130, 160, 740, 850);
      URL.revokeObjectURL(url);

      // 3. Draw Polaroid bottom border & caption
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, 980, 920, 180);

      ctx.fillStyle = '#3b0764';
      ctx.font = 'bold 46px "Fredoka", "Quicksand", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Best Dressed Duck ✨', 500, 1055);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 24px "Quicksand", sans-serif';
      const nowStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      ctx.fillText(nowStr + ' · CIEL WebGames Poki Edition', 500, 1105);

      // Export as PNG
      const pngData = canvas.toDataURL('image/png');

      // Set polaroid preview in modal
      document.getElementById('polaroidImg').src = pngData;
      document.getElementById('polaroidDate').textContent = nowStr + ' · Fashion Look';

      // Auto-download PNG
      const link = document.createElement('a');
      link.download = 'My_Dress_Up_Duck.png';
      link.href = pngData;
      link.click();

      // Show preview modal
      openModal('modalPhoto');
      showToast('Photo downloaded to your device! 📸');
    };
    img.src = url;
  }

  bindEvents() {
    // Setup Category Tabs Slider
    const tabs = this.dom.categoryTabs;
    const btnPrev = document.getElementById('btnTabPrev');
    const btnNext = document.getElementById('btnTabNext');
    const thumb = document.getElementById('tabSliderThumb');

    const updateSlider = () => {
      if (!tabs) return;
      const maxScroll = tabs.scrollWidth - tabs.clientWidth;
      if (btnPrev) btnPrev.classList.toggle('disabled', tabs.scrollLeft <= 4);
      if (btnNext) btnNext.classList.toggle('disabled', tabs.scrollLeft >= maxScroll - 4);

      if (thumb && maxScroll > 0) {
        const ratio = Math.max(0, Math.min(1, tabs.scrollLeft / maxScroll));
        const track = thumb.parentElement;
        if (track) {
          const trackWidth = track.clientWidth;
          const thumbWidth = Math.max(30, (tabs.clientWidth / tabs.scrollWidth) * trackWidth);
          thumb.style.width = thumbWidth + 'px';
          thumb.style.transform = `translateX(${ratio * (trackWidth - thumbWidth)}px)`;
        }
      }
    };

    if (btnPrev) {
      btnPrev.onclick = () => {
        sound.pop();
        tabs.scrollBy({ left: -160, behavior: 'smooth' });
      };
    }
    if (btnNext) {
      btnNext.onclick = () => {
        sound.pop();
        tabs.scrollBy({ left: 160, behavior: 'smooth' });
      };
    }

    tabs.addEventListener('scroll', updateSlider, { passive: true });
    window.addEventListener('resize', updateSlider);
    setTimeout(updateSlider, 50);

    // Mouse wheel horizontal scroll on tabs
    tabs.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        tabs.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Drag-to-slide on desktop
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    tabs.addEventListener('mousedown', (e) => {
      isDown = true;
      tabs.classList.add('is-dragging');
      startX = e.pageX - tabs.offsetLeft;
      scrollStart = tabs.scrollLeft;
    });
    window.addEventListener('mouseup', () => {
      if (isDown) {
        isDown = false;
        tabs.classList.remove('is-dragging');
      }
    });
    tabs.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - tabs.offsetLeft;
      const walk = (x - startX) * 1.5;
      tabs.scrollLeft = scrollStart - walk;
    });

    // Category Tabs click
    this.dom.categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        sound.pop();
        this.dom.categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.dataset.cat;
        this.renderDrawer();
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        setTimeout(updateSlider, 200);
      };
    });

    // Header buttons
    document.getElementById('btnBackToMenu').onclick = () => {
      sound.pop();
      openMainMenu();
    };
    document.getElementById('btnRandomize').onclick = () => this.randomizeOutfit();
    document.getElementById('btnReset').onclick = () => openModal('modalReset');
    document.getElementById('btnPhoto').onclick = () => this.takePhoto();

    // Tap duck to squish & sparkle
    if (this.dom.duckSvg) {
      this.dom.duckSvg.addEventListener('click', () => {
        sound.pop();
        this.triggerSquish();
        this.emitSparkles(200, 220, 8);
      });
    }

    // Sound toggle
    const btnSound = document.getElementById('btnSound');
    const chkSound = document.getElementById('chkSound');
    const updateSoundUI = () => {
      btnSound.classList.toggle('muted', !sound.enabled);
      if (chkSound) chkSound.checked = sound.enabled;
    };
    btnSound.onclick = () => {
      sound.enabled = !sound.enabled;
      localStorage.setItem('duck_sound', sound.enabled);
      updateSoundUI();
      sound.pop();
    };
    if (chkSound) {
      chkSound.onchange = (e) => {
        sound.enabled = e.target.checked;
        localStorage.setItem('duck_sound', sound.enabled);
        updateSoundUI();
      };
    }
    updateSoundUI();

    // Fullscreen toggle
    document.getElementById('btnFullscreen').onclick = toggleFullscreen;
    const btnModalFs = document.getElementById('btnToggleFsInModal');
    if (btnModalFs) btnModalFs.onclick = toggleFullscreen;

    // Modals buttons
    document.getElementById('btnMenuPlay').onclick = closeMainMenu;
    document.getElementById('btnMenuHelp').onclick = () => openModal('modalHelp');
    document.getElementById('btnMenuSettings').onclick = () => openModal('modalSettings');

    document.getElementById('btnClosePhoto').onclick = () => closeModal('modalPhoto');
    document.getElementById('btnClosePhotoBtn').onclick = () => closeModal('modalPhoto');
    document.getElementById('btnDownloadAgain').onclick = () => {
      const src = document.getElementById('polaroidImg').src;
      if (src) {
        const link = document.createElement('a');
        link.download = 'My_Dress_Up_Duck.png';
        link.href = src;
        link.click();
      }
    };

    document.getElementById('btnConfirmReset').onclick = () => {
      this.resetOutfit();
      closeModal('modalReset');
    };
    document.getElementById('btnCancelReset').onclick = () => closeModal('modalReset');

    document.getElementById('btnCloseHelp').onclick = () => closeModal('modalHelp');
    document.getElementById('btnCloseSettings').onclick = () => closeModal('modalSettings');
    document.getElementById('btnDoneSettings').onclick = () => closeModal('modalSettings');

    // Exit Game handlers
    document.getElementById('btnMenuExit').onclick = () => openModal('modalExit');
    const btnCloseExit = document.getElementById('btnCloseExit');
    if (btnCloseExit) btnCloseExit.onclick = () => closeModal('modalExit');
    document.getElementById('btnCancelExit').onclick = () => closeModal('modalExit');
    document.getElementById('btnConfirmExit').onclick = () => {
      sound.pop();
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ action: 'closeModal', type: 'GAME_ENDED' }, '*');
          window.parent.postMessage('closeModal', '*');
          window.parent.postMessage({ type: 'closeModal' }, '*');
        }
      } catch (e) {}

      try { window.close(); } catch (e) {}

      setTimeout(() => {
        if (window.history && window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '../';
        }
      }, 120);
    };

    // Close modal on outside click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal.id);
      };
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          closeModal(activeModal.id);
        } else {
          const menu = document.getElementById('screenMainMenu');
          if (menu.classList.contains('hidden')) {
            openMainMenu();
          } else {
            closeMainMenu();
          }
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.randomizeOutfit();
      } else if (e.code === 'KeyZ') {
        this.resetOutfit();
      } else if (e.code === 'KeyS' || e.code === 'KeyP') {
        this.takePhoto();
      }
    });
  }

  bindDragDrop() {
    const ghost = this.dom.dragGhost;
    const stage = document.getElementById('stageCard');

    document.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.item-card');
      if (!card || card.dataset.cat === 'colors') return;

      const cat = card.dataset.cat;
      const id = card.dataset.id;
      if (id === 'none') return;

      this.dragItem = { cat, id, card };
    });

    document.addEventListener('pointermove', (e) => {
      if (!this.dragItem) return;

      const item = (ITEMS[this.dragItem.cat] || []).find(x => x.id === this.dragItem.id);
      if (!item) return;

      ghost.style.display = 'block';
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
      ghost.innerHTML = `<svg viewBox="${item.previewBox || '0 0 400 460'}">${item.svg}</svg>`;

      // Check drop hover over stage
      const rect = stage.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;

      stage.classList.toggle('drag-over', isOver);
    });

    document.addEventListener('pointerup', (e) => {
      if (!this.dragItem) return;

      ghost.style.display = 'none';
      stage.classList.remove('drag-over');

      const rect = stage.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                     e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (isOver) {
        this.equip(this.dragItem.cat, this.dragItem.id);
      }

      this.dragItem = null;
    });
  }
}

// =========================================================================
// UI HELPERS
// =========================================================================
function openMainMenu() {
  document.getElementById('screenMainMenu').classList.remove('hidden');
}

function closeMainMenu() {
  sound.init();
  sound.pop();
  document.getElementById('screenMainMenu').classList.add('hidden');
}

function openModal(id) {
  sound.pop();
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}

function closeModal(id) {
  sound.pop();
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function toggleFullscreen() {
  sound.pop();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Init App on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new DressUpGame();

  // Notify CIEL Loader that app is completely ready
  if (window.CielLoader && typeof window.CielLoader.done === 'function') {
    window.CielLoader.done();
  }
});
