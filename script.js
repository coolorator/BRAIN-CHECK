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
    
    // Testbildschirm Elemente
    const timerEl = document.getElementById('timer');
    const progressEl = document.getElementById('progress');
    const keyContainer = document.getElementById('key-container');
    const currentSymbolEl = document.getElementById('current-symbol');
    const digitInput = document.getElementById('digit-input');

    // Pausenbildschirm Elemente
    const pauseTimerEl = document.getElementById('pause-timer');
    const distractionTaskEl = document.getElementById('distraction-task');

    // Ergebnisbildschirm Elemente
    const resultsRound1El = document.getElementById('results-round1');
    const resultsRound2El = document.getElementById('results-round2');
    const learningRateEl = document.getElementById('learning-rate');
    const learningInterpretationEl = document.getElementById('learning-interpretation');

    // --- Zustandsvariablen ---
    let state = {};

    // Konstanten
    const TEST_DURATION = 90; // in Sekunden
    const PAUSE_DURATION = 60; // in Sekunden
    const SEQUENCE_LENGTH = 500;
    const DISTRACTION_INTERVAL = 5; // alle 5 Sekunden eine neue Aufgabe
    const SYMBOLS = ['★', '●', '■', '▲', '♥', '♦', '♣', '♠', '♪'];

    // --- Initialisierung ---
    function init() {
        state = {
            currentRound: 0,
            symbolKey: null,
            testSequence: [],
            currentIndex: 0,
            scores: [
                { correct: 0, incorrect: 0, finalScore: 0 }, // Platzhalter für Runde 1
                { correct: 0, incorrect: 0, finalScore: 0 }, // Platzhalter für Runde 2
            ],
            timers: {
                test: null,
                pause: null,
                distraction: null,
            },
        };
        showScreen('start');
    }

    // --- Bildschirmsteuerung ---
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenName].classList.remove('hidden');
    }

    // --- Test-Logik ---
    function startChallenge() {
        generateKeyAndSequence();
        displayKey();
        startRound(1);
    }
    
    // Generiert einmalig den Schlüssel und die 500 Symbole lange Testsequenz
    function generateKeyAndSequence() {
        const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Mische die Ziffern, um eine zufällige Zuordnung zu erhalten
        for (let i = digits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [digits[i], digits[j]] = [digits[j], digits[i]];
        }
        
        state.symbolKey = {};
        SYMBOLS.forEach((symbol, index) => {
            state.symbolKey[symbol] = digits[index];
        });

        state.testSequence = [];
        for (let i = 0; i < SEQUENCE_LENGTH; i++) {
            const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
            state.testSequence.push(SYMBOLS[randomIndex]);
        }
    }

    // Zeigt den generierten Schlüssel an
    function displayKey() {
        keyContainer.innerHTML = '';
        SYMBOLS.forEach(symbol => {
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
        state.scores[roundNumber - 1] = { correct: 0, incorrect: 0, finalScore: 0 };
        
        showScreen('test');
        displayNextSymbol();
        startTimer(TEST_DURATION, timerEl, endRound);
        digitInput.value = '';
        digitInput.focus();
    }
    
    function displayNextSymbol() {
        if (state.currentIndex >= SEQUENCE_LENGTH) {
            endRound(); // Beendet die Runde, wenn alle Symbole durch sind
            return;
        }
        currentSymbolEl.textContent = state.testSequence[state.currentIndex];
        progressEl.textContent = `Symbol ${state.currentIndex + 1} / ${SEQUENCE_LENGTH}`;
    }

    function handleInput(e) {
        const enteredValue = e.target.value;
        if (!enteredValue || !/^[1-9]$/.test(enteredValue)) {
            return;
        }

        const currentSymbol = state.testSequence[state.currentIndex];
        const correctDigit = state.symbolKey[currentSymbol];
        
        if (parseInt(enteredValue) === correctDigit) {
            state.scores[state.currentRound - 1].correct++;
        } else {
            state.scores[state.currentRound - 1].incorrect++;
        }
        
        // Eingabe leeren und zum nächsten Symbol wechseln
        e.target.value = '';
        state.currentIndex++;
        displayNextSymbol();
    }
    
    function endRound() {
        clearInterval(state.timers.test);
        
        if (state.currentRound === 1) {
            startPause();
        } else {
            showResults();
        }
    }

    // --- Pausen-Logik ---
    function startPause() {
        showScreen('pause');
        startTimer(PAUSE_DURATION, pauseTimerEl, () => {
            clearInterval(state.timers.distraction);
            startRound(2);
        });
        showDistractionTask(); // Erste Aufgabe sofort anzeigen
        state.timers.distraction = setInterval(showDistractionTask, DISTRACTION_INTERVAL * 1000);
    }
    
    function showDistractionTask() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        distractionTaskEl.textContent = `${num1} × ${num2} = ?`;
    }


    // --- Ergebnis-Logik ---
    function showResults() {
        // Berechne finale Punktzahlen
        const score1 = state.scores[0].correct - state.scores[0].incorrect;
        state.scores[0].finalScore = score1;
        const score2 = state.scores[1].correct - state.scores[1].incorrect;
        state.scores[1].finalScore = score2;
        
        const learningRate = score2 - score1;
        
        // Zeige Ergebnisse an
        resultsRound1El.textContent = `${score1} (${state.scores[0].correct} / ${state.scores[0].incorrect})`;
        resultsRound2El.textContent = `${score2} (${state.scores[1].correct} / ${state.scores[1].incorrect})`;
        learningRateEl.textContent = `${learningRate > 0 ? '+' : ''}${learningRate}`;
        
        // Interpretation
        let interpretation = '';
        if (learningRate > 5) {
            interpretation = 'Hervorragende Steigerung! Du lernst sehr schnell.';
        } else if (learningRate > 0) {
            interpretation = 'Gute Verbesserung! Übung macht den Meister.';
        } else if (learningRate === 0) {
            interpretation = 'Konstante Leistung! Du hast dein Niveau gehalten.';
        } else {
            interpretation = 'Runde 2 war eine Herausforderung. Das ist normal, weiter so!';
        }
        learningInterpretationEl.textContent = interpretation;
        
        showScreen('results');
    }

    // --- Hilfsfunktionen (Timer) ---
    function startTimer(duration, displayElement, onEndCallback) {
        let timer = duration;
        function tick() {
            let minutes = parseInt(timer / 60, 10);
            let seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            displayElement.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                if (state.currentRound > 0) {
                     clearInterval(state.timers.test);
                } else {
                     clearInterval(state.timers.pause);
                }
                onEndCallback();
            }
        }
        tick(); // Sofortiger Aufruf, um 0-Sekunden-Verzögerung zu vermeiden
        
        const intervalId = setInterval(tick, 1000);
        
        if (displayElement === timerEl) {
            state.timers.test = intervalId;
        } else {
            state.timers.pause = intervalId;
        }
    }

    // --- Event Listener ---
    startBtn.addEventListener('click', startChallenge);
    restartBtn.addEventListener('click', init);
    digitInput.addEventListener('input', handleInput);

    // App initialisieren, wenn die Seite geladen ist
    init();
});
