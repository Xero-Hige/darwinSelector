const RADIUS = 5;

const COLOR_DEAD = "black";
const COLOR_NORMAL = "gray";
const COLOR_INFECTED = "red";
const COLOR_RECOVERED = "green";

const TICKS = 14 * 140;

const THRESH = 250;

const PEOPLE = 600;

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

const Ball = function (x, y) {


};

Ball.prototype = {

    getColor: function () {
        if (this.death)
            return COLOR_DEAD;

        if (this.infected)
            return COLOR_INFECTED;

        if (this.recovered)
            return COLOR_RECOVERED

        return COLOR_NORMAL;
    },

    normalizeSpeed: function () {
        let norm = Math.pow(this.directionY, 2) + Math.pow(this.directionX, 2);

        norm = Math.sqrt(norm);
        norm = norm ? norm : 1;

        this.directionX = norm === 1 ? 0 : (this.directionX / norm);
        this.directionY = norm === 1 ? 0 : (this.directionY / norm);
    },

    render: function (c) {
        c.fillStyle = this.getColor();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
    },

    updatePosition: function (width, height) {

        if (this.death)
            return;

        this.x += this.directionX;
        this.y += this.directionY;

        if (this.x - this.radius < 0) {

            this.x = this.radius;
            this.directionX = -this.directionX;

        } else if (this.x + this.radius > width) {

            this.x = width - this.radius;
            this.directionX = -this.directionX;

        }

        if (this.y - this.radius < 0) {

            this.y = this.radius;
            this.directionY = -this.directionY;

        } else if (this.y + this.radius > height) {

            this.y = height - this.radius;
            this.directionY = -this.directionY;

        }

        this.colide = false;

    },

    colision: function (anotherBall) {
        let distance = Math.pow(this.x - anotherBall.x, 2) + Math.pow(this.y - anotherBall.y, 2)
        distance = Math.sqrt(distance);

        if (distance > RADIUS * 2)
            return;

        let x = this.x - anotherBall.x;
        let y = this.y - anotherBall.y;

        if (Boolean(this.directionX) || Boolean(this.directionY)) {
            this.directionX = x;
            this.directionY = y;
        }

        if (Boolean(anotherBall.directionX) || Boolean(anotherBall.directionY)) {
            anotherBall.directionX = -x;
            anotherBall.directionY = -y;
        }

        this.normalizeSpeed();
        anotherBall.normalizeSpeed();


        //let directionX = this.directionX;
        //let directionY = this.directionY;

        //this.directionX = anotherBall.directionX;
        //this.directionY = anotherBall.directionY;

        //anotherBall.directionX = directionX;
        //anotherBall.directionY = directionY;

        this.colide = true;
        anotherBall.colide = true;

        if (this.infected && !(anotherBall.infected || anotherBall.recovered)) {
            anotherBall.infected = true;
        }

        if (anotherBall.infected && !(this.infected || this.recovered)) {
            this.infected = true;
        }
    }

};

var context = document.querySelector("canvas").getContext("2d");

var balls = new Array();

let x = document.documentElement.clientWidth;
let y = document.documentElement.clientHeight;



for (let index = 50; index < balls.length; index++) {
    let person = balls[index];

    person.directionX = 0;
    person.directionY = 0;
}

balls[0].infected = true;

function loop() {

    window.requestAnimationFrame(loop);

    let height = document.documentElement.clientHeight;
    let width = document.documentElement.clientWidth;

    context.canvas.height = height;
    context.canvas.width = width;

    shuffle(balls);



    for (let index = 0; index < balls.length; index++) {

        let ball = balls[index];
        ball.tick(infecteds);
        ball.render(context);
        ball.updatePosition(width, height);

    }

}

loop();



