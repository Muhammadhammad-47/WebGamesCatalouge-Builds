const BLOCK_TEXTURES = {
    blue: 'assets/blocks/block_blue.png',
    cyan: 'assets/blocks/block_cyan.png',
    green: 'assets/blocks/block_green.png',
    orange: 'assets/blocks/block_orange.png',
    pink: 'assets/blocks/block_pink.png',
    purple: 'assets/blocks/block_purple.png',
    red: 'assets/blocks/block_red.png',
    gold: 'assets/blocks/block_gold.png',
    silver: 'assets/blocks/block_silver.png',
    gem_blue: 'assets/blocks/block_wood_blue_gem.png',
    gem_yellow: 'assets/blocks/block_wood_yellow_gem.png',
    gem_green: 'assets/blocks/block_wood_green_gem.png',
    gem_red: 'assets/blocks/block_wood_red_gem.png'
};

const PIECE_DEFINITIONS = [
    // 1x1
    { shape: [[1]], color: 'pink' },

    // 1x2 and 2x1
    { shape: [[1, 1]], color: 'cyan' },
    { shape: [[1], [1]], color: 'cyan' },

    // 1x3 and 3x1
    { shape: [[1, 1, 1]], color: 'orange' },
    { shape: [[1], [1], [1]], color: 'orange' },

    // 1x4 and 4x1
    { shape: [[1, 1, 1, 1]], color: 'blue' },
    { shape: [[1], [1], [1], [1]], color: 'blue' },

    // 1x5 and 5x1
    { shape: [[1, 1, 1, 1, 1]], color: 'red' },
    { shape: [[1], [1], [1], [1], [1]], color: 'red' },

    // 2x2 Square
    { shape: [[1, 1], [1, 1]], color: 'gold' },

    // 3x3 Square
    { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'gem_blue' },

    // 2x2 Corners
    { shape: [[1, 0], [1, 1]], color: 'green' },
    { shape: [[0, 1], [1, 1]], color: 'green' },
    { shape: [[1, 1], [1, 0]], color: 'green' },
    { shape: [[1, 1], [0, 1]], color: 'green' },

    // 3x3 Large Corners
    { shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'purple' },
    { shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: 'purple' },
    { shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'purple' },
    { shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: 'purple' },

    // T-Shapes
    { shape: [[1, 1, 1], [0, 1, 0]], color: 'magenta' },
    { shape: [[0, 1, 0], [1, 1, 1]], color: 'magenta' },
    { shape: [[1, 0], [1, 1], [1, 0]], color: 'magenta' },
    { shape: [[0, 1], [1, 1], [0, 1]], color: 'magenta' },

    // 3x2 L-Shapes
    { shape: [[1, 0], [1, 0], [1, 1]], color: 'cyan' },
    { shape: [[0, 1], [0, 1], [1, 1]], color: 'cyan' },
    { shape: [[1, 1], [1, 0], [1, 0]], color: 'cyan' },
    { shape: [[1, 1], [0, 1], [0, 1]], color: 'cyan' },

    // 2x3 L-Shapes
    { shape: [[1, 1, 1], [1, 0, 0]], color: 'silver' },
    { shape: [[1, 1, 1], [0, 0, 1]], color: 'silver' },
    { shape: [[1, 0, 0], [1, 1, 1]], color: 'silver' },
    { shape: [[0, 0, 1], [1, 1, 1]], color: 'silver' },

    // Z and S Shapes
    { shape: [[1, 1, 0], [0, 1, 1]], color: 'gem_green' },
    { shape: [[0, 1, 1], [1, 1, 0]], color: 'gem_yellow' },
    { shape: [[1, 0], [1, 1], [0, 1]], color: 'gem_green' },
    { shape: [[0, 1], [1, 1], [1, 0]], color: 'gem_yellow' },

    // Diagonal 2 and 3
    { shape: [[1, 0], [0, 1]], color: 'pink' },
    { shape: [[0, 1], [1, 0]], color: 'pink' }
];

function getRandomPiece() {
    const def = PIECE_DEFINITIONS[Math.floor(Math.random() * PIECE_DEFINITIONS.length)];
    // Deep clone shape
    const shape = def.shape.map(row => [...row]);
    return {
        shape,
        color: def.color,
        texture: BLOCK_TEXTURES[def.color] || BLOCK_TEXTURES.blue
    };
}
