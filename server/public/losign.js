function createComet() {
    const comet = document.createElement('div');
    comet.className = 'comet';

    // Randomize the comet's horizontal position
    comet.style.left = Math.random() * window.innerWidth + 'px';

    document.body.appendChild(comet);

    // Remove the comet after the animation ends
    comet.addEventListener('animationend', () => {
        comet.remove();
    });
}

// Create a comet every 1.5 seconds
setInterval(createComet, 2500);

function createTiles() {
    const background = document.querySelector('.tiled-background');
    const numberOfTiles = Math.ceil((window.innerWidth / 24) * (window.innerHeight / 25)) ; // Calculate the number of tiles based on screen size

    for (let i = 0; i < numberOfTiles; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        background.appendChild(tile);
    }
}

createTiles(); 