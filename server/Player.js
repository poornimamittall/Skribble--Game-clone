class Player {
    constructor(id, name, socketId) {
        this.id = id;
        this.name = name;
        this.socketId = socketId;
        this.score = 0;
        this.hasGuessed = false;
        this.isReady = false;
    }

    addScore(points) {
        this.score += points;
    }

    reset() {
        this.hasGuessed = false;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            score: this.score,
            hasGuessed: this.hasGuessed,
            isReady: this.isReady,
        };
    }
}

module.exports = Player;