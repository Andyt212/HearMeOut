let globalCharacters = [];
let currentCharacterIndex = 0;
let isLoading = true;

// Function to initialize the app
function initApp() {
    console.log('Initializing app');
    
    // Get DOM elements
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');
    const imageElement = document.querySelector('.Hear-Me-Out');
    const characterNameElement = document.getElementById('characterName');
    const showNameElement = document.getElementById('showName');
    
    // Reset progress bars on initial load
    if (yesButton) {
        const yesProgress = yesButton.querySelector('.progress');
        if (yesProgress) {
            yesProgress.style.width = '0%';
            yesProgress.textContent = '';
            yesProgress.style.backgroundColor = 'transparent';
        }
    }
    if (noButton) {
        const noProgress = noButton.querySelector('.progress');
        if (noProgress) {
            noProgress.style.width = '0%';
            noProgress.textContent = '';
            noProgress.style.backgroundColor = 'transparent';
        }
    }

    // Debug logs for DOM elements
    console.log('Yes button found:', !!yesButton);
    console.log('No button found:', !!noButton);
    console.log('Image element found:', !!imageElement);

    // Fetch characters from the server
    fetch('/api/images')
        .then(response => response.json())
        .then(data => {
            globalCharacters = data.characters;
            isLoading = false;
            console.log('Loaded characters:', globalCharacters.length);
            // Load the first character if available
            if (globalCharacters.length > 0) {
                updateCharacterDisplay(0);
            }
        })
        .catch(error => {
            console.error('Error loading characters:', error);
        });
}

function updateCharacterDisplay(index) {
    const imageElement = document.querySelector('.Hear-Me-Out');
    const characterNameElement = document.getElementById('characterName');
    const showNameElement = document.getElementById('showName');
    
    const character = globalCharacters[index];
    if (character && imageElement) {
        imageElement.src = character.image;
        if (characterNameElement) characterNameElement.textContent = character.name;
        if (showNameElement) showNameElement.textContent = character.show;
        
        loadCommentsForCharacter(character.name);
    }
}

function nextCharacter() {
    if (isLoading || globalCharacters.length === 0) return;
    
    currentCharacterIndex++;
    
    if (currentCharacterIndex >= globalCharacters.length) {
        // Hide the voting interface
        const buttonContainer = document.querySelector('.button-container');
        const imageElement = document.querySelector('.Hear-Me-Out');
        const characterNameElement = document.getElementById('characterName');
        const showNameElement = document.getElementById('showName');
        
        if (buttonContainer) buttonContainer.style.display = 'none';
        if (imageElement) imageElement.style.display = 'none';
        if (characterNameElement) characterNameElement.style.display = 'none';
        if (showNameElement) showNameElement.style.display = 'none';
        
        // Show end message
        const endMessage = document.createElement('div');
        endMessage.textContent = "That's all for now! Check back later for more.";
        endMessage.style.textAlign = 'center';
        endMessage.style.marginTop = '20px';
        document.querySelector('.center-image-container').appendChild(endMessage);
        
        return;
    }
    
    // If not at the end, update display as normal
    updateCharacterDisplay(currentCharacterIndex);
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

document.addEventListener('DOMContentLoaded', () => {
    const yesButton = document.getElementById('yesButton');
    const noButton = document.getElementById('noButton');

    let yesVotes = 0;
    let noVotes = 0;

    function updateProgressBars() {
        const total = yesVotes + noVotes;
        if (total === 0) return;

        const yesPercentage = (yesVotes / total) * 100;
        const noPercentage = (noVotes / total) * 100;

        // Hide the button text
        yesButton.querySelector('.button-text').style.display = 'none';
        noButton.querySelector('.button-text').style.display = 'none';

        // Update the progress bars and show percentages
        yesButton.querySelector('.progress').style.width = `${yesPercentage}%`;
        noButton.querySelector('.progress').style.width = `${noPercentage}%`;
        
        // Add percentage text
        yesButton.querySelector('.progress').textContent = `${Math.round(yesPercentage)}%`;
        noButton.querySelector('.progress').textContent = `${Math.round(noPercentage)}%`;
    }

    function handleVote(isYesVote) {
        if (isLoading || globalCharacters.length === 0) return;
        
        const currentCharacter = globalCharacters[currentCharacterIndex];
        
        // Disable buttons immediately
        const yesButton = document.getElementById('yesButton');
        const noButton = document.getElementById('noButton');
        yesButton.disabled = true;
        noButton.disabled = true;

        // Immediately hide the button text
        const yesButtonText = yesButton.querySelector('.button-text');
        const noButtonText = noButton.querySelector('.button-text');
        yesButtonText.style.opacity = '0';
        noButtonText.style.opacity = '0';
        
        fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                characterName: currentCharacter.name,
                voteType: isYesVote ? 'up' : 'down'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update progress bars with new percentages
                yesButton.querySelector('.progress').style.width = `${data.percentages.upvotePercentage}%`;
                noButton.querySelector('.progress').style.width = `${data.percentages.downvotePercentage}%`;
                
                yesButton.querySelector('.progress').textContent = `${Math.round(data.percentages.upvotePercentage)}%`;
                noButton.querySelector('.progress').textContent = `${Math.round(data.percentages.downvotePercentage)}%`;
                
                // Move to next character after delay
                setTimeout(() => {
                    // Reset buttons
                    yesButton.disabled = false;
                    noButton.disabled = false;
                    
                    // Reset progress bars
                    yesButton.querySelector('.progress').style.width = '0%';
                    noButton.querySelector('.progress').style.width = '0%';
                    yesButton.querySelector('.progress').textContent = '';
                    noButton.querySelector('.progress').textContent = '';
                    
                    // Show button text again with a fade in effect
                    yesButtonText.style.opacity = '1';
                    noButtonText.style.opacity = '1';
                    
                    nextCharacter();
                }, 2000);
            }
        })
        .catch(error => {
            console.error('Error submitting vote:', error);
            // Re-enable buttons and show text if there's an error
            yesButton.disabled = false;
            noButton.disabled = false;
            yesButtonText.style.opacity = '1';
            noButtonText.style.opacity = '1';
        });
    }
    
    if (yesButton) yesButton.addEventListener('click', () => handleVote(true));
    if (noButton) noButton.addEventListener('click', () => handleVote(false));
});

document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');
    const commentsContainer = document.getElementById('commentsContainer');

    if (!commentForm || !commentInput || !commentsContainer) {
        console.error('Required comment elements not found!');
        return;
    }

    commentForm.addEventListener('click', (e) => {
        e.preventDefault();
        const comment = commentInput.value.trim();
        if (!comment) return;

        const currentCharacter = globalCharacters[currentCharacterIndex];
        if (!currentCharacter) return;

        // Create and display the comment immediately
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        commentElement.innerHTML = `
            <div class="comment-text">${comment}</div>
        `;
        commentsContainer.appendChild(commentElement);
        
        // Clear input
        commentInput.value = '';

        // Save to server
        fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                characterName: currentCharacter.name,
                comment: comment
            })
        })
        .catch(error => {
            console.error('Error saving comment:', error);
            commentElement.remove();
        });
    });
});

// Add this function to load comments for a character
function loadCommentsForCharacter(characterName) {
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) return;
    
    // Clear existing comments
    commentsContainer.innerHTML = '';
    
    fetch(`/api/comments/${encodeURIComponent(characterName)}`)
        .then(response => response.json())
        .then(comments => {
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-text">${comment.comment_text}</div>
                `;
                commentsContainer.appendChild(commentElement);
            });
        })
        .catch(error => console.error('Error loading comments:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    const unmuteButton = document.getElementById('unmuteButton');
    const backgroundMusic = document.getElementById('backgroundMusic');
    let isMuted = true;

    unmuteButton.addEventListener('click', () => {
        if (isMuted) {
            // Reset the song to the beginning when unmuting
            backgroundMusic.currentTime = 0;
            backgroundMusic.play();
            unmuteButton.textContent = '🔊'; // Unmuted emoji
        } else {
            backgroundMusic.pause();
            unmuteButton.textContent = '🔇'; // Muted emoji
        }
        isMuted = !isMuted;
    });
});