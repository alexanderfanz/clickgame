const VERSION = '0.1.0';  // Semantic versioning (major.minor.patch)
const MAX_BALLS = 5;
const BALL_SIZE = 60;
let nextNumber = MAX_BALLS + 1;  // Track the next number to use
let isFullScreen = false;
const MAX_ATTEMPTS = 50;  // Maximum attempts to find non-overlapping position

// Function to get root domain from current hostname
function getRootDomain() {
    const parts = window.location.hostname.split('.');
    if (parts.length > 2) {
        // Remove the subdomain
        return '//' + parts.slice(1).join('.');
    }
    return '//'; // Fallback to root if no subdomain
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomPosition() {
    const maxX = window.innerWidth - BALL_SIZE;
    const maxY = window.innerHeight - BALL_SIZE;
    return {
        x: Math.floor(Math.random() * maxX),
        y: Math.floor(Math.random() * maxY)
    };
}

function isOverlapping(position, existingBalls) {
    // Check if a position overlaps with any existing balls
    for (const ball of existingBalls) {
        const ballRect = ball.getBoundingClientRect();
        const ballX = ballRect.left;
        const ballY = ballRect.top;

        // Calculate distance between centers
        const dx = position.x - ballX;
        const dy = position.y - ballY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If distance is less than ball diameter (with small buffer), they overlap
        if (distance < BALL_SIZE * 1.2) {
            return true;
        }
    }
    return false;
}

function getNonOverlappingPosition() {
    const existingBalls = document.querySelectorAll('.ball');
    let attempts = 0;
    let position;

    do {
        position = getRandomPosition();
        attempts++;
        
        // If we can't find a non-overlapping position after MAX_ATTEMPTS,
        // return the last attempted position
        if (attempts >= MAX_ATTEMPTS) {
            console.warn('Could not find non-overlapping position after', MAX_ATTEMPTS, 'attempts');
            return position;
        }
    } while (isOverlapping(position, existingBalls));

    return position;
}

function adjustBallPosition(ball) {
    const maxX = window.innerWidth - BALL_SIZE;
    const maxY = window.innerHeight - BALL_SIZE;
    
    // Get current position
    let x = parseInt(ball.style.left);
    let y = parseInt(ball.style.top);
    
    // Adjust if out of bounds
    x = Math.min(Math.max(0, x), maxX);
    y = Math.min(Math.max(0, y), maxY);
    
    // Update position
    ball.style.left = x + 'px';
    ball.style.top = y + 'px';
}

function handleResize() {
    const balls = document.querySelectorAll('.ball');
    balls.forEach(ball => adjustBallPosition(ball));
}

function createBall(number) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    ball.textContent = number;
    ball.dataset.number = number;
    ball.style.backgroundColor = getRandomColor();
    const position = getNonOverlappingPosition();
    ball.style.left = position.x + 'px';
    ball.style.top = position.y + 'px';
    return ball;
}

function resetGame() {
    // Remove all existing balls
    const balls = document.querySelectorAll('.ball');
    balls.forEach(ball => ball.remove());
    
    // Reset the next number counter
    nextNumber = MAX_BALLS + 1;
    
    // Create new initial balls
    for (let i = 1; i <= MAX_BALLS; i++) {
        const ball = createBall(i);
        document.body.appendChild(ball);
    }
}

async function toggleFullScreen() {
    if (!isFullScreen) {
        const element = document.documentElement;
        try {
            // Try the most aggressive full screen options
            if (element.requestFullscreen) {
                await element.requestFullscreen({
                    navigationUI: "hide",
                    requireUserActivation: false
                });
            } else if (element.webkitRequestFullscreen) {
                // For Safari
                element.webkitRequestFullscreen(Element.WEBKIT_REQUEST_FULLSCREEN_TYPE_KEYBOARD_INPUT_BLOCKED);
            } else if (element.mozRequestFullScreen) {
                // For Firefox
                element.mozRequestFullScreen({ requireUserActivation: false });
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Update fullscreen button text
function updateFullscreenButtonText() {
    const fullscreenButton = document.getElementById('fullscreenButton');
    fullscreenButton.textContent = isFullScreen ? 'Exit Full Screen' : 'Full Screen';
}

// Add fullscreen change event listeners
document.addEventListener('fullscreenchange', () => {
    isFullScreen = !!document.fullscreenElement;
    updateFullscreenButtonText();
});

document.addEventListener('webkitfullscreenchange', () => {
    isFullScreen = !!document.webkitFullscreenElement;
    updateFullscreenButtonText();
});

document.addEventListener('msfullscreenchange', () => {
    isFullScreen = !!document.msFullscreenElement;
    updateFullscreenButtonText();
});

function initializeGame() {
    // Log version information
    console.log('Ball Clicking Game v' + VERSION);

    // Set home link URL
    const homeLink = document.getElementById('homeLink');
    homeLink.href = getRootDomain();

    // Create initial balls with sequential numbers 1 to MAX_BALLS
    for (let i = 1; i <= MAX_BALLS; i++) {
        const ball = createBall(i);
        document.body.appendChild(ball);
    }

    // Add reset button event listener
    document.getElementById('resetButton').addEventListener('click', resetGame);

    // Add fullscreen button event listener
    document.getElementById('fullscreenButton').addEventListener('click', toggleFullScreen);

    // Add click event listener to body for event delegation
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('ball')) {
            const balls = document.querySelectorAll('.ball');
            const numbers = Array.from(balls).map(ball => 
                parseInt(ball.dataset.number));
            const minNumber = Math.min(...numbers);

            if (parseInt(e.target.dataset.number) === minNumber) {
                // Remove clicked ball
                e.target.remove();
                // Create new ball with next sequential number
                const newBall = createBall(nextNumber);
                nextNumber++;  // Increment for next ball
                document.body.appendChild(newBall);
            }
        }
    });

    // Add window resize event listener
    window.addEventListener('resize', handleResize);
}

// Start the game when the page loads
window.onload = initializeGame; 