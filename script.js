document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('flashcard-file');
    const flashcard = document.getElementById('flashcard');
    const termElement = document.getElementById('term');
    const descriptionElement = document.getElementById('description');
    const showAnswerBtn = document.getElementById('show-answer');
    const ratingButtons = document.getElementById('rating-buttons');
    const progressBar = document.getElementById('progress-bar');
    const learnedCount = document.getElementById('learned-count');
    const totalCount = document.getElementById('total-count');
    const termsList = document.getElementById('terms');
    
    // Flashcard data
    let flashcards = [];
    let currentIndex = 0;
    let learned = 0;
    
    // Add sample data button for testing
    const sampleDataBtn = document.createElement('button');
    sampleDataBtn.textContent = 'Load Sample Data';
    sampleDataBtn.className = 'btn';
    sampleDataBtn.style.marginTop = '10px';
    sampleDataBtn.addEventListener('click', loadSampleData);
    document.querySelector('.file-input').appendChild(sampleDataBtn);
    
    // Event listeners
    fileInput.addEventListener('change', handleFileUpload);
    showAnswerBtn.addEventListener('click', showAnswer);
    
    document.querySelectorAll('.rating-btn').forEach(button => {
        button.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            rateCard(rating);
        });
    });
    
    // Functions
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            parseFlashcards(e.target.result);
        };
        reader.onerror = function() {
            alert("Error reading file. Please try again.");
        };
        reader.readAsText(file);
    }
    
    function loadSampleData() {
        const sampleData = `apple:a fruit with red or green skin and a whitish interior
cat:a small domesticated carnivorous mammal
JavaScript:a high-level programming language often used for web development
mountain:a large natural elevation of the earth's surface
ocean:a very large expanse of sea
book:a written or printed work consisting of pages`;
        
        parseFlashcards(sampleData);
    }
    
    function parseFlashcards(text) {
        // Reset data
        flashcards = [];
        currentIndex = 0;
        learned = 0;
        
        // Parse the text file (format: term:description)
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;
            
            // Find the first colon to separate term and description
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;
            
            const term = line.substring(0, colonIndex).trim();
            const description = line.substring(colonIndex + 1).trim();
            
            if (!term || !description) continue;
            
            flashcards.push({
                term,
                description,
                status: 'new',
                nextReview: Date.now(),
                interval: 0
            });
        }
        
        // Update UI
        totalCount.textContent = flashcards.length;
        learnedCount.textContent = '0';
        updateProgressBar();
        updateTermsList();
        
        if (flashcards.length > 0) {
            showNextCard();
        } else {
            termElement.textContent = "No valid flashcards found";
            descriptionElement.textContent = "Please check your file format (term:description)";
            alert("No valid flashcards found in the file. Please check the format.");
        }
    }
    
    function showNextCard() {
        // Find the next card due for review
        const now = Date.now();
        let dueCards = flashcards.filter(card => card.nextReview <= now && card.status !== 'learned');
        
        if (dueCards.length === 0) {
            // If no cards are due, show a message
            termElement.textContent = "No cards due for review!";
            descriptionElement.textContent = "All caught up for now.";
            showAnswerBtn.style.display = 'none';
            ratingButtons.style.display = 'none';
            return;
        }
        
        // Sort by status (new first, then learning) and then by nextReview
        dueCards.sort((a, b) => {
            if (a.status === 'new' && b.status !== 'new') return -1;
            if (a.status !== 'new' && b.status === 'new') return 1;
            return a.nextReview - b.nextReview;
        });
        
        // Get the first due card
        const cardIndex = flashcards.indexOf(dueCards[0]);
        currentIndex = cardIndex;
        
        // Update the flashcard
        termElement.textContent = flashcards[currentIndex].term;
        descriptionElement.textContent = flashcards[currentIndex].description;
        
        // Reset the flashcard state
        flashcard.classList.remove('flipped');
        showAnswerBtn.style.display = 'block';
        ratingButtons.style.display = 'none';
        
        // Update the status if it's a new card
        if (flashcards[currentIndex].status === 'new') {
            flashcards[currentIndex].status = 'learning';
            updateTermsList();
        }
    }
    
    function showAnswer() {
        flashcard.classList.add('flipped');
        showAnswerBtn.style.display = 'none';
        ratingButtons.style.display = 'flex';
    }
    
    function rateCard(rating) {
        // Spaced repetition algorithm (simplified)
        const card = flashcards[currentIndex];
        
        // Update interval based on rating
        if (rating === 1) { // Hard
            card.interval = Math.max(1, Math.floor(card.interval * 0.5));
        } else if (rating === 3) { // Good
            card.interval = card.interval === 0 ? 1 : card.interval * 2;
        } else { // Easy
            card.interval = card.interval === 0 ? 3 : card.interval * 3;
        }
        
        // Calculate next review time (in milliseconds)
        // For simplicity: 1 interval unit = 1 minute
        card.nextReview = Date.now() + (card.interval * 60 * 1000);
        
        // Mark as learned if interval is large enough
        if (card.interval >= 30 && card.status !== 'learned') {
            card.status = 'learned';
            learned++;
            learnedCount.textContent = learned;
            updateProgressBar();
        }
        
        updateTermsList();
        showNextCard();
    }
    
    function updateProgressBar() {
        const percentage = flashcards.length > 0 ? (learned / flashcards.length) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
    
    function updateTermsList() {
        termsList.innerHTML = '';
        
        flashcards.forEach((card, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${card.term} 
                <span class="status status-${card.status}">${card.status}</span>
            `;
            
            li.addEventListener('click', () => {
                currentIndex = index;
                termElement.textContent = card.term;
                descriptionElement.textContent = card.description;
                flashcard.classList.remove('flipped');
                showAnswerBtn.style.display = 'block';
                ratingButtons.style.display = 'none';
            });
            
            termsList.appendChild(li);
        });
    }
});
