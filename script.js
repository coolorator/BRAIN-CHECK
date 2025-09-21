document.addEventListener('DOMContentLoaded', () => {

    // --- DOM-Elemente ---
    const screens = {
        start: document.getElementById('start-screen'),
        test: document.getElementById('test-screen'),
        pause: document.getElementById('pause-screen'),
        results: document.getElementById('results-screen'),
    };
    const startBtn = document.getElementById('start-challenge-btn');
    const restartBtn = document.getElementById('restart-btn');
    const timerEl = document.getElementById('timer');
    const progressEl = document.getElementById('progress');
    const keyContainer = document.getElementById('key-container');
    const currentSymbolEl = document.getElementById('current-symbol');
    const digitInput = document.getElementById('digit-input');
    const pauseTimerEl = document.getElementById('pause-timer');
    const distractionTaskEl = document.getElementById('distraction-task');
    const distractionInput = document.getElementById('distraction-input');
    const distractionFeedbackEl = document.getElementById('distraction-feedback');
    const distractionPromptEl = document.getElementById('distraction-prompt');
    const resultsRound1El = document.getElementById('results-round1');
    const resultsRound2El = document.getElementById('results-round2');
    const learningRateEl = document.getElementById('learning-rate');
    const learningInterpretationEl = document.getElementById('learning-interpretation');

    // --- Konstanten & Zustand ---
    const TEST_DURATION = 90;
    const PAUSE_DURATION = 60;
    const SEQUENCE_LENGTH = 500;
    const PROMPT_DELAY = 5000; // 5 Sekunden für "Go!"
    const MASTER_SYMBOL_POOL = ['★','●','■','▲','♥','♦','♣','♠','♪','☂','☀','❄','☾','✈','☺','⚛','✎','✌','✇','✠','☯','⌘','☠','✔','✡','☪','☮','☣','❤','✂'];

    let state = {};

    function init() {
        // Stoppt alle laufenden Timer, falls vorhanden
        if (state.timers) {
            Object.values(state.timers).forEach(timer => clearInterval(timer));
            if(state.promptTimeout) clearTimeout(state.promptTimeout);
        }

        state = {
            currentRound: 0,
            symbolKey: null,
            sessionSymbols: [],
            testSequence: [],
            currentIndex: 0,
            distractionAnswer: null,
            promptTimeout: null,
            scores: [
                { correct: 0, incorrect: 0 },
                { correct: 0, incorrect: 0 },
            ],
            timers: {
                test: null,
                pause: null,
            },
        };
        showScreen('start');
    }

    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    }

    function startChallenge() {
        generateKeyAndSequence();
        displayKey();
        startRound(1);
    }

    function generateKeyAndSequence() {
        // Wählt bei jedem Neustart 9 zufällige Symbole aus dem großen Pool aus
        const shuffledPool = [...MASTER_SYMBOL_POOL].sort(() => 0.5 - Math.random());
        state.sessionSymbols = shuffledPool.slice(0, 9);
        
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => 0.5 - Math.random());
        
        state.symbolKey = {};
        state.sessionSymbols.forEach((symbol, index) => {
            state.symbolKey[symbol] = digits[index];
        });

        state.testSequence = [];
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * state.sessionSymbols.length);
            state.testSequence.push(state.sessionSymbols[randomIndex]);
        }
    }

    function displayKey() {
        keyContainer.innerHTML = '';
        state.sessionSymbols.forEach(symbol => {
            const digit = state.symbolKey[symbol];
            const keyItem = document.createElement('div');
            keyItem.className = 'key-item';
            keyItem.innerHTML = `<span class="symbol">${symbol}</span><span>${digit}</span>`;
            keyContainer.appendChild(keyItem);
        });
    }

    function startRound(roundNumber) {
        state.currentRound = roundNumber;
        state.currentIndex = 0;
        state.scores[roundNumber - 1] = { correct: 0, incorrect: 0 };
        
        showScreen('test');
        displayNextSymbol();
        startTimer(TEST_DURATION, timerEl, endRound, 'test');
        digitInput.value = '';
        digitInput.focus();
    }
    
    function displayNextSymbol() {
        if (state.currentIndex >= SEQUENCE_LENGTH) {
            endRound();
            return;
        }
        currentSymbolEl.textContent = state.testSequence[state.currentIndex];
        progressEl.textContent = `Symbol ${state.currentIndex + 1} / ${SEQUENCE_LENGTH}`;
    }

    function handleInput() {
        const enteredValue = digitInput.value;
        if (!enteredValue || !/^[1-9]$/.test(enteredValue)) return;

        const correctDigit = state.symbolKey[state.testSequence[state.currentIndex]];
        
        if (parseInt(enteredValue) === correctDigit) {
            state.scores[state.currentRound - 1].correct++;
        } else {
            state.scores[state.currentRound - 1].incorrect++;
        }
        
        digitInput.value = '';
        state.currentIndex++;
        displayNextSymbol();
    }
    
    function endRound() {
        clearInterval(state.timers.test);
        state.timers.test = null;
        
        if (state.currentRound === 1) {
            startPause();
        } else {
            showResults();
        }
    }

    function startPause() {
        showScreen('pause');
        distractionInput.value = '';
        distractionFeedbackEl.textContent = '';
        distractionPromptEl.textContent = '';
        
        startTimer(PAUSE_DURATION, pauseTimerEl, () => {
            clearTimeout(state.promptTimeout);
            startRound(2);
        }, 'pause');
        
        showDistractionTask();
        distractionInput.focus();
    }
    
    function showDistractionTask() {
        clearTimeout(state.promptTimeout);
        distractionInput.value = '';
        distractionFeedbackEl.textContent = '';
        distractionPromptEl.textContent = '';
        
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        state.distractionAnswer = num1 * num2;
        distractionTaskEl.textContent = `${num1} × ${num2} = ?`;

        state.promptTimeout = setTimeout(() => {
            distractionPromptEl.textContent = 'Go!';
        }, PROMPT_DELAY);
    }
    
    function handleDistractionInput() {
        const userAnswer = parseInt(distractionInput.value, 10);
        if (isNaN(userAnswer)) return;

        if (userAnswer === state.distractionAnswer) {
            distractionFeedbackEl.textContent = '✅'; // Smiley
            setTimeout(showDistractionTask, 500);
        } else {
            // Check if input length matches answer length to give feedback
            if(distractionInput.value.length >= String(state.distractionAnswer).length) {
                distractionFeedbackEl.textContent = '💀'; // Totenkopf
                setTimeout(() => {
                    distractionInput.value = '';
                    distractionFeedbackEl.textContent = '';
                }, 700);
            }
        }
    }

    function showResults() {
        const score1 = state.scores[0].correct - state.scores[0].incorrect;
        const score2 = state.scores[1].correct - state.scores[1].incorrect;
        const learningRate = score2 - score1;
        
        resultsRound1El.textContent = `${score1} (${state.scores[0].correct} / ${state.scores[0].incorrect})`;
        resultsRound2El.textContent = `${score2} (${state.scores[1].correct} / ${state.scores[1].incorrect})`;
        learningRateEl.textContent = `${learningRate > 0 ? '+' : ''}${learningRate}`;
        
        let interpretation = '';
        if (learningRate > 5) interpretation = 'Hervorragende Steigerung! Du lernst sehr schnell.';
        else if (learningRate > 0) interpretation = 'Gute Verbesserung! Übung macht den Meister.';
        else if (learningRate === 0) interpretation = 'Konstante Leistung! Du hast dein Niveau gehalten.';
        else interpretation = 'Runde 2 war eine Herausforderung. Das ist normal, weiter so!';
        learningInterpretationEl.textContent = interpretation;
        
        showScreen('results');
    }

    function startTimer(duration, displayElement, onEndCallback, timerName) {
        // Stoppt einen vorherigen Timer mit demselben Namen
        if (state.timers[timerName]) {
            clearInterval(state.timers[timerName]);
        }
        
        let timer = duration;
        function tick() {
            let minutes = String(Math.floor(timer / 60)).padStart(2, '0');
            let seconds = String(timer % 60).padStart(2, '0');
            displayElement.textContent = `${minutes}:${seconds}`;

            if (--timer < 0) {
                clearInterval(state.timers[timerName]);
                state.timers[timerName] = null;
                onEndCallback();
            }
        }
        tick();
        state.timers[timerName] = setInterval(tick, 1000);
    }

    // --- Event Listener ---
    startBtn.addEventListener('click', startChallenge);
    restartBtn.addEventListener('click', init);
    digitInput.addEventListener('input', handleInput);
    distractionInput.addEventListener('input', handleDistractionInput);

    init();
});
