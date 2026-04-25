class Game {
    constructor(settings) {
        this.rounds = settings.rounds || 3;
        this.drawTime = settings.drawTime || 80;
        this.wordCount = settings.wordCount || 3;
        this.hints = settings.hints || 2;
        this.currentRound = 0;
        this.currentDrawerIndex = 0;
        this.currentWord = null;
        this.wordOptions = [];
        this.phase = "waiting";
        this.timer = null;
        this.timeLeft = 0;
        this.revealedIndices = new Set();
        this.hintInterval = null;
        this.countdownInterval = null;
    }

    getHintWord(word) {
        const chars = word.split("");
        return chars
            .map((c, i) => {
                if (c === " ") return " ";
                if (this.revealedIndices.has(i)) return c;
                return "_";
            })
            .join(" ");
    }

    revealNextHint(word) {
        const hiddenIndices = [];
        word.split("").forEach((c, i) => {
            if (c !== " " && !this.revealedIndices.has(i)) hiddenIndices.push(i);
        });
        if (hiddenIndices.length === 0) return false;
        const idx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
        this.revealedIndices.add(idx);
        return true;
    }

    startCountdown() {
        this.countdownInterval = setInterval(() => {
            if (this.timeLeft > 0) this.timeLeft--;
        }, 1000);
    }

    reset() {
        this.currentRound = 0;
        this.currentDrawerIndex = 0;
        this.currentWord = null;
        this.phase = "waiting";
        this.revealedIndices = new Set();
        this.clearTimers();
    }

    clearTimers() {
        if (this.timer) clearTimeout(this.timer);
        if (this.hintInterval) clearInterval(this.hintInterval);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.timer = null;
        this.hintInterval = null;
        this.countdownInterval = null;
    }
}

module.exports = Game;