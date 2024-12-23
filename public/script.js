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
        
        // Load comments for this character
        loadCommentsForCharacter(character.name);
    }
}

function nextCharacter() {
    if (isLoading || globalCharacters.length === 0) return;
    
    currentCharacterIndex++;
    
    // Check if we've reached the end
    if (currentCharacterIndex >= globalCharacters.length) {
        // Hide the buttons
        const buttonContainer = document.querySelector('.button-container');
        if (buttonContainer) {
            buttonContainer.style.display = 'none';
        }
        
        // Hide the image
        const imageElement = document.querySelector('.Hear-Me-Out');
        if (imageElement) {
            imageElement.style.display = 'none';
        }

        // Hide character name and show name
        const characterNameElement = document.getElementById('characterName');
        const showNameElement = document.getElementById('showName');
        if (characterNameElement) characterNameElement.style.display = 'none';
        if (showNameElement) showNameElement.style.display = 'none';
        
        // Create and show end message
        const endMessage = document.createElement('div');
        endMessage.style.textAlign = 'center';
        endMessage.style.marginTop = '20px';
        endMessage.style.fontFamily = 'Neue Montreal, sans-serif';
        endMessage.style.fontSize = '2rem';
        endMessage.textContent = "That's all for now! Check back later for more.";
        
        // Insert the message after the image
        const centerImageContainer = document.querySelector('.center-image-container');
        if (centerImageContainer) {
            centerImageContainer.appendChild(endMessage);
        }
        
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
        
        // Send vote to server
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
            // Get the updated percentages
            fetch(`/api/percentages/${encodeURIComponent(currentCharacter.name)}`)
                .then(response => response.json())
                .then(percentages => {
                    // Hide the button text
                    yesButton.querySelector('.button-text').style.display = 'none';
                    noButton.querySelector('.button-text').style.display = 'none';

                    // Update the progress bars and show percentages
                    yesButton.querySelector('.progress').style.width = `${percentages.upvotePercentage}%`;
                    noButton.querySelector('.progress').style.width = `${percentages.downvotePercentage}%`;
                    
                    // Add percentage text
                    yesButton.querySelector('.progress').textContent = `${Math.round(percentages.upvotePercentage)}%`;
                    noButton.querySelector('.progress').textContent = `${Math.round(percentages.downvotePercentage)}%`;
                    
                    // Move to next character after delay
                    setTimeout(() => {
                        // Reset buttons
                        [yesButton, noButton].forEach(button => {
                            button.disabled = false;
                            button.querySelector('.button-text').style.display = 'block';
                            button.querySelector('.progress').style.width = '0%';
                            button.querySelector('.progress').textContent = '';
                        });
                        
                        // Clear comments
                        const commentsContainer = document.getElementById('commentsContainer');
                        if (commentsContainer) {
                            commentsContainer.innerHTML = '';
                        }
                        
                        // Clear comment input
                        const commentInput = document.getElementById('commentInput');
                        if (commentInput) {
                            commentInput.value = '';
                        }
                        
                        nextCharacter();
                    }, 2000);
                });
        })
        .catch(error => {
            console.error('Error submitting vote:', error);
            // Re-enable buttons if there's an error
            yesButton.disabled = false;
            noButton.disabled = false;
        });
    }
    
    yesButton.addEventListener('click', () => handleVote(true));
    noButton.addEventListener('click', () => handleVote(false));
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