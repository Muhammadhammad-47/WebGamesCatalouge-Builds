// =============================================================================
// Level Devil - Levels Definition & Troll Logic
// 15 crafted levels with authentic Level Devil surprises, traps, and timing
// =============================================================================

const LEVELS = [
    // -------------------------------------------------------------------------
    // LEVEL 1: BABY STEPS (Warmup, simple jump)
    // -------------------------------------------------------------------------
    {
        id: 1,
        title: "BABY STEPS",
        sub: "A gentle walk in the park...",
        playerStart: { x: 80, y: 360 },
        door: { x: 820, y: 340, w: 42, h: 60 },
        blocks: [
            // Left platform
            { x: 0, y: 400, w: 440, h: 140, solid: true, color: '#1c100c' },
            // Gap from x: 440 to 520 (80px gap)
            // Right platform
            { x: 520, y: 400, w: 440, h: 140, solid: true, color: '#1c100c' },
            // Left wall & ceiling
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Hazard in the pit
            { x: 450, y: 500, w: 60, h: 40, dir: 'up' }
        ],
        trolls: []
    },

    // -------------------------------------------------------------------------
    // LEVEL 2: WATCH YOUR STEP (Floor collapses beneath you)
    // -------------------------------------------------------------------------
    {
        id: 2,
        title: "WATCH YOUR STEP",
        sub: "Looks totally safe. Trust me.",
        playerStart: { x: 80, y: 360 },
        door: { x: 820, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 500, h: 140, solid: true, color: '#1c100c' },
            // Trap floor section that falls
            { id: 'fallingFloor', x: 500, y: 400, w: 160, h: 40, solid: true, color: '#1c100c', isTrap: true },
            { x: 660, y: 400, w: 300, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 510, y: 510, w: 140, h: 30, dir: 'up' }
        ],
        trolls: [
            {
                triggered: false,
                triggerX: 420,
                onTrigger: (state) => {
                    const floor = state.blocks.find(b => b.id === 'fallingFloor');
                    if (floor) {
                        floor.falling = true;
                        state.player.triggerShock(45);
                    }
                },
                onUpdate: (state) => {
                    const floor = state.blocks.find(b => b.id === 'fallingFloor');
                    if (floor && floor.falling) {
                        floor.y += 12;
                        if (floor.y > 600) floor.solid = false;
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 3: DON'T LOOK UP (Ceiling spike drops on you)
    // -------------------------------------------------------------------------
    {
        id: 3,
        title: "DON'T LOOK UP",
        sub: "Keep your eyes straight ahead.",
        playerStart: { x: 80, y: 360 },
        door: { x: 820, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 960, h: 140, solid: true, color: '#1c100c' },
            // Ceiling
            { x: 0, y: 0, w: 960, h: 60, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Innocent resting spike on ceiling
            { id: 'dropSpike1', x: 440, y: 60, w: 36, h: 36, dir: 'down', falling: false },
            { id: 'dropSpike2', x: 620, y: 60, w: 36, h: 36, dir: 'down', falling: false }
        ],
        trolls: [
            {
                triggered: false,
                triggerX: 350,
                onTrigger: (state) => {
                    const s1 = state.spikes.find(s => s.id === 'dropSpike1');
                    if (s1) {
                        s1.falling = true;
                        state.player.triggerShock(45);
                    }
                },
                onUpdate: (state) => {
                    const s1 = state.spikes.find(s => s.id === 'dropSpike1');
                    if (s1 && s1.falling && s1.y < 364) {
                        s1.y += 14;
                    }
                }
            },
            {
                triggered: false,
                triggerX: 530,
                onTrigger: (state) => {
                    const s2 = state.spikes.find(s => s.id === 'dropSpike2');
                    if (s2) {
                        s2.falling = true;
                        state.player.triggerShock(45);
                    }
                },
                onUpdate: (state) => {
                    const s2 = state.spikes.find(s => s.id === 'dropSpike2');
                    if (s2 && s2.falling && s2.y < 364) {
                        s2.y += 14;
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 4: RUNAWAY DOOR (Door dashes away right when you reach it)
    // -------------------------------------------------------------------------
    {
        id: 4,
        title: "NO TOUCHING!",
        sub: "Personal space is very important.",
        playerStart: { x: 80, y: 360 },
        door: { id: 'movingDoor', x: 480, y: 340, w: 42, h: 60, targetX: 480 },
        blocks: [
            { x: 0, y: 400, w: 480, h: 140, solid: true, color: '#1c100c' },
            // Gap in middle
            { x: 680, y: 400, w: 280, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 490, y: 500, w: 180, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                triggered: false,
                triggerX: 380,
                onTrigger: (state) => {
                    state.door.targetX = 840;
                    state.player.triggerShock(60);
                },
                onUpdate: (state) => {
                    if (state.door.x < state.door.targetX) {
                        state.door.x += (state.door.targetX - state.door.x) * 0.15;
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 5: LEAP OF FAITH (Stepping into the void reveals invisible blocks)
    // -------------------------------------------------------------------------
    {
        id: 5,
        title: "LEAP OF FAITH",
        sub: "Close your eyes and jump.",
        playerStart: { x: 80, y: 360 },
        door: { x: 820, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 240, h: 140, solid: true, color: '#1c100c' },
            // Giant gap between 240 and 720
            // Hidden blocks that become visible on proximity
            { id: 'inv1', x: 300, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', hidden: true, alpha: 0 },
            { id: 'inv2', x: 440, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', hidden: true, alpha: 0 },
            { id: 'inv3', x: 580, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', hidden: true, alpha: 0 },
            { x: 720, y: 400, w: 240, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 250, y: 510, w: 460, h: 30, dir: 'up' }
        ],
        trolls: [
            {
                triggered: false,
                onUpdate: (state) => {
                    ['inv1', 'inv2', 'inv3'].forEach(id => {
                        const b = state.blocks.find(blk => blk.id === id);
                        if (b && Math.abs((state.player.x + 16) - (b.x + b.w / 2)) < 110) {
                            if (b.hidden) {
                                b.hidden = false;
                                if (window.soundManager) window.soundManager.playClick();
                            }
                            b.alpha = Math.min(1.0, b.alpha + 0.12);
                        }
                    });
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 6: CONFUSED? (Controls reverse halfway across!)
    // -------------------------------------------------------------------------
    {
        id: 6,
        title: "CONFUSED?",
        sub: "Left is right... wait, what?!",
        playerStart: { x: 80, y: 360 },
        door: { x: 820, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 420, h: 140, solid: true, color: '#1c100c' },
            { x: 540, y: 400, w: 420, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 430, y: 500, w: 100, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                triggered: false,
                triggerX: 380,
                onTrigger: (state) => {
                    state.player.controlsInverted = true;
                    state.player.triggerShock(90);
                    state.banner = "CONTROLS INVERTED!";
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 7: CEILING CRUSH (Ceiling begins coming down after 1.5s)
    // -------------------------------------------------------------------------
    {
        id: 7,
        title: "CEILING CRUSH",
        sub: "Hurry before you get squashed!",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 960, h: 140, solid: true, color: '#1c100c' },
            // Descending ceiling slab
            { id: 'crushCeiling', x: 40, y: -40, w: 880, h: 100, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Low hurdle
            { x: 480, y: 360, w: 40, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                timer: 90, // starts after 1.5s
                onUpdate: (state, troll) => {
                    if (troll.timer > 0) {
                        troll.timer--;
                    } else {
                        const ceiling = state.blocks.find(b => b.id === 'crushCeiling');
                        if (ceiling && ceiling.y + ceiling.h < 345) {
                            ceiling.y += 0.85;
                        }
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 8: SNEAKY SPIKES (Spikes pop out of the floor when close)
    // -------------------------------------------------------------------------
    {
        id: 8,
        title: "POP GOES THE SPIKE",
        sub: "Step lightly...",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 960, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Hidden underneath floor at y: 400, pop up to y: 360
            { id: 'pop1', x: 340, y: 400, targetY: 360, w: 40, h: 40, dir: 'up', popped: false },
            { id: 'pop2', x: 580, y: 400, targetY: 360, w: 40, h: 40, dir: 'up', popped: false }
        ],
        trolls: [
            {
                triggered: false,
                triggerX: 250,
                onTrigger: (state) => {
                    const spk = state.spikes.find(s => s.id === 'pop1');
                    if (spk) {
                        spk.popped = true;
                        state.player.triggerShock(45);
                    }
                },
                onUpdate: (state) => {
                    const spk = state.spikes.find(s => s.id === 'pop1');
                    if (spk && spk.popped && spk.y > spk.targetY) {
                        spk.y -= 10;
                    }
                }
            },
            {
                triggered: false,
                triggerX: 490,
                onTrigger: (state) => {
                    const spk = state.spikes.find(s => s.id === 'pop2');
                    if (spk) {
                        spk.popped = true;
                        state.player.triggerShock(45);
                    }
                },
                onUpdate: (state) => {
                    const spk = state.spikes.find(s => s.id === 'pop2');
                    if (spk && spk.popped && spk.y > spk.targetY) {
                        spk.y -= 10;
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 9: BOUNCY DOOR (Door jumps up and down over a pit)
    // -------------------------------------------------------------------------
    {
        id: 9,
        title: "BOUNCY DOOR",
        sub: "Catch it if you can!",
        playerStart: { x: 80, y: 360 },
        door: { x: 740, y: 340, origY: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 460, h: 140, solid: true, color: '#1c100c' },
            // Pit with island
            { x: 700, y: 400, w: 120, h: 140, solid: true, color: '#1c100c' },
            { x: 880, y: 400, w: 80, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 470, y: 500, w: 220, h: 40, dir: 'up' },
            { x: 830, y: 500, w: 40, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                time: 0,
                onUpdate: (state, troll) => {
                    troll.time += 0.08;
                    state.door.y = state.door.origY - Math.abs(Math.sin(troll.time)) * 140;
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 10: UPSIDE DOWN (Gravity Inversion switch!)
    // -------------------------------------------------------------------------
    {
        id: 10,
        title: "GRAVITY WHO?",
        sub: "What goes up, stays up.",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 100, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 360, h: 140, solid: true, color: '#1c100c' },
            // Wall of spikes block the bottom path
            { x: 0, y: 60, w: 960, h: 40, solid: true, color: '#1c100c' }, // ceiling
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Massive bed of ground spikes from 360 to 920
            { x: 360, y: 370, w: 560, h: 40, dir: 'up' }
        ],
        switches: [
            { x: 260, y: 390, w: 40, h: 10, pressed: false, color: '#ffd32a' }
        ],
        trolls: [
            {
                triggered: false,
                onUpdate: (state) => {
                    const sw = state.switches && state.switches[0];
                    if (sw && !sw.pressed && Math.abs(state.player.x - sw.x) < 25) {
                        sw.pressed = true;
                        state.player.gravityInverted = true;
                        state.player.triggerShock(60);
                        state.banner = "GRAVITY FLIPPED!";
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 11: CRUMBLING PATH (Platforms fall 0.4s after touching them)
    // -------------------------------------------------------------------------
    {
        id: 11,
        title: "CRUMBLES",
        sub: "Don't stop, never stop!",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 160, h: 140, solid: true, color: '#1c100c' },
            { id: 'c1', x: 220, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', shake: 0 },
            { id: 'c2', x: 360, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', shake: 0 },
            { id: 'c3', x: 500, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', shake: 0 },
            { id: 'c4', x: 640, y: 400, w: 80, h: 40, solid: true, color: '#1c100c', shake: 0 },
            { x: 780, y: 400, w: 180, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 170, y: 510, w: 600, h: 30, dir: 'up' }
        ],
        trolls: [
            {
                onUpdate: (state) => {
                    ['c1', 'c2', 'c3', 'c4'].forEach(id => {
                        const b = state.blocks.find(blk => blk.id === id);
                        if (!b) return;
                        if (state.player.isGrounded && state.player.x + 32 > b.x && state.player.x < b.x + b.w && Math.abs((state.player.y + 32) - b.y) < 5) {
                            if (!b.timer) b.timer = 24; // 24 frames (~0.4s)
                        }
                        if (b.timer !== undefined) {
                            b.timer--;
                            b.x += (Math.random() - 0.5) * 4;
                            if (b.timer <= 0) {
                                b.y += 14;
                                if (b.y > 600) b.solid = false;
                            }
                        }
                    });
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 12: SIKE! (Door vanishes at touch and moves back to start)
    // -------------------------------------------------------------------------
    {
        id: 12,
        title: "SIKE!",
        sub: "Almost had it!",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 960, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 380, y: 360, w: 40, h: 40, dir: 'up' },
            { x: 560, y: 360, w: 40, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                sikeDone: false,
                onUpdate: (state, troll) => {
                    if (!troll.sikeDone && state.player.x > 770) {
                        troll.sikeDone = true;
                        state.door.x = 80;
                        state.player.triggerShock(60);
                        state.banner = "NOPE! GO BACK!";
                        if (window.soundManager) window.soundManager.playTroll();
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 13: THE CHASE (Moving wall of doom)
    // -------------------------------------------------------------------------
    {
        id: 13,
        title: "SPEED RUN",
        sub: "It is right behind you!",
        playerStart: { x: 120, y: 360 },
        door: { x: 850, y: 340, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 960, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            // Moving spike wall starting at x = 0
            { id: 'chaseWall', x: 20, y: 60, w: 30, h: 340, dir: 'right', isWall: true },
            // Hurdles along the way
            { x: 380, y: 360, w: 40, h: 40, dir: 'up' },
            { x: 620, y: 360, w: 40, h: 40, dir: 'up' },
        ],
        trolls: [
            {
                delay: 40,
                onUpdate: (state, troll) => {
                    if (troll.delay > 0) {
                        troll.delay--;
                    } else {
                        const wall = state.spikes.find(s => s.id === 'chaseWall');
                        if (wall && wall.x < 780) {
                            wall.x += 2.6;
                        }
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 14: TRUST ISSUES (Three doors: only one is the real exit)
    // -------------------------------------------------------------------------
    {
        id: 14,
        title: "TRUST ISSUES",
        sub: "Pick a door. Any door.",
        playerStart: { x: 80, y: 360 },
        door: { x: 840, y: 220, w: 42, h: 60 }, // Real middle door
        decoyDoors: [
            { id: 'fakeTop', x: 840, y: 90, w: 42, h: 60 },
            { id: 'fakeBot', x: 840, y: 340, w: 42, h: 60 }
        ],
        blocks: [
            { x: 0, y: 400, w: 440, h: 140, solid: true, color: '#1c100c' },
            // Shelves for 3 doors
            { x: 780, y: 150, w: 140, h: 20, solid: true, color: '#1c100c' },
            { x: 780, y: 280, w: 140, h: 20, solid: true, color: '#1c100c' },
            { x: 780, y: 400, w: 140, h: 140, solid: true, color: '#1c100c' },
            // Floating steps to reach them
            { x: 500, y: 320, w: 70, h: 20, solid: true, color: '#1c100c' },
            { x: 620, y: 230, w: 70, h: 20, solid: true, color: '#1c100c' },
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { x: 450, y: 500, w: 320, h: 40, dir: 'up' }
        ],
        trolls: [
            {
                onUpdate: (state) => {
                    // Check touch on fake doors
                    if (state.decoyDoors) {
                        state.decoyDoors.forEach(fd => {
                            if (!fd.popped && Math.abs(state.player.x - fd.x) < 30 && Math.abs(state.player.y - fd.y) < 40) {
                                fd.popped = true;
                                state.player.dead = true;
                                if (window.soundManager) window.soundManager.playDeath();
                            }
                        });
                    }
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // LEVEL 15: THE FINAL EXAM (Falling spikes + collapsing floor + runaway door)
    // -------------------------------------------------------------------------
    {
        id: 15,
        title: "THE FINAL EXAM",
        sub: "Everything you've learned. Good luck.",
        playerStart: { x: 80, y: 360 },
        door: { x: 520, y: 340, targetX: 520, w: 42, h: 60 },
        blocks: [
            { x: 0, y: 400, w: 380, h: 140, solid: true, color: '#1c100c' },
            { id: 'finalFloor', x: 380, y: 400, w: 180, h: 40, solid: true, color: '#1c100c' },
            { x: 560, y: 400, w: 360, h: 140, solid: true, color: '#1c100c' },
            { x: 0, y: 60, w: 960, h: 40, solid: true, color: '#1c100c' }, // ceiling
            { x: 0, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
            { x: 920, y: 0, w: 40, h: 400, solid: true, color: '#1c100c' },
        ],
        spikes: [
            { id: 'finalDropSpike', x: 470, y: 100, w: 40, h: 40, dir: 'down', falling: false },
            { x: 670, y: 360, w: 40, h: 40, dir: 'up' },
        ],
        trolls: [
            {
                triggered1: false,
                triggered2: false,
                triggerX1: 300,
                triggerX2: 450,
                onUpdate: (state, troll) => {
                    // Troll 1: ceiling spike drops
                    if (!troll.triggered1 && state.player.x > troll.triggerX1) {
                        troll.triggered1 = true;
                        const spk = state.spikes.find(s => s.id === 'finalDropSpike');
                        if (spk) spk.falling = true;
                        state.player.triggerShock(45);
                    }
                    const spk = state.spikes.find(s => s.id === 'finalDropSpike');
                    if (spk && spk.falling && spk.y < 360) {
                        spk.y += 14;
                    }

                    // Troll 2: floor drops & door runs to x = 840
                    if (!troll.triggered2 && state.player.x > troll.triggerX2) {
                        troll.triggered2 = true;
                        state.door.targetX = 840;
                        const floor = state.blocks.find(b => b.id === 'finalFloor');
                        if (floor) floor.falling = true;
                        state.player.triggerShock(60);
                    }
                    const floor = state.blocks.find(b => b.id === 'finalFloor');
                    if (floor && floor.falling) {
                        floor.y += 14;
                        if (floor.y > 600) floor.solid = false;
                    }
                    if (state.door.x < state.door.targetX) {
                        state.door.x += (state.door.targetX - state.door.x) * 0.16;
                    }
                }
            }
        ]
    }
];

window.LEVELS = LEVELS;
