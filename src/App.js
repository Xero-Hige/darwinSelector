import React from 'react';
import './App.css';
import simpleNumberLocalizer from 'react-widgets-simple-number';
import TextField from '@material-ui/core/TextField';

simpleNumberLocalizer();

const RADIUS = 5;
const TICKS = 14 * 30;

const COLOR_DEAD = "black";
const COLOR_NORMAL = "gray";
const COLOR_INFECTED = "red";
const COLOR_RECOVERED = "green";

function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

class App extends React.Component {
    state = {
        people: 500,
        height: 535,
        width: 1360,
        healthSystemLimit: 500,
        quarantinePercent: 85,
        i: 0
    };

    handleChange(target, event, minValue, maxValue) {
        let value = event.target.value;

        value = Math.max(minValue, value);
        value = Math.min(maxValue, value);

        this.setState({[target]: value})
    }

    render() {
        return <div>
            <div id="controls"
                 style={{
                     padding: "1em"
                 }}>

                <TextField id="outlined-number"
                           label="Personas"
                           type="number"
                           InputLabelProps={{
                               shrink: true,
                           }}
                           variant="outlined"
                           onChange={event => {this.handleChange("people", event, 0, 7000),this.handleChange("healthSystemLimit", event, 0, 7000)}}
                           value={this.state.people}/>

                <TextField id="outlined-number"
                           label="Alto"
                           type="number"
                           InputLabelProps={{
                               shrink: true,
                           }}
                           variant="outlined"
                           onChange={event => this.handleChange("height", event, 0, 9000)}
                           value={this.state.height}/>

                <TextField id="outlined-number"
                           label="Ancho"
                           type="number"
                           InputLabelProps={{
                               shrink: true,
                           }}
                           variant="outlined"
                           onChange={event => this.handleChange("width", event, 0, 9000)}
                           value={this.state.width}/>

                <TextField id="outlined-number"
                           label="Porcentaje en cuarentena"
                           type="number"
                           InputLabelProps={{
                               shrink: true,
                           }}
                           variant="outlined"
                           onChange={event => this.handleChange("quarantinePercent", event, 0, 100)}
                           value={this.state.quarantinePercent}/>

                <TextField id="outlined-number"
                           label="Porcentaje en cuarentena"
                           type="number"
                           InputLabelProps={{
                               shrink: true,
                           }}
                           variant="outlined"
                           onChange={event => this.handleChange("healthSystemLimit", event, 0, this.state.people)}
                           value={this.state.healthSystemLimit}/>
            </div>

            <br/>

            Infectados: {this.state.infected}
            | Curados: {this.state.recovered}
            | Muertos: {this.state.dead}
            | No infectados: {this.state.noInfected}

            <Animation i={this.state.i}
                       height={this.state.height}
                       width={this.state.width}
                       people={this.state.people}
                       healthSystemLimit={this.state.healthSystemLimit}
                       quarantinePercent={this.state.quarantinePercent}
                       setStatus={(status) => this.setState(status)}
            />
        </div>;
    }
}

class World {

    constructor(width, height) {
        this.people = [];
        this.worldWidth = width;
        this.worldHeight = height;
        this.healthSystemLimit = 0;
    }

    populate(peopleAmount, quarantinePercent, healthSystemLimit) {
        this.people = [];
        this.healthSystemLimit = healthSystemLimit;

        for (let index = 0; index < peopleAmount; index++) {
            this.people.push(new Person(this.worldWidth * Math.random(), this.worldHeight * Math.random()));
        }

        let quarantined = Math.ceil(peopleAmount * (100 - quarantinePercent) / 100);
        quarantined = Math.min(peopleAmount, quarantined);
        quarantined = Math.max(0, quarantined);

        for (let index = quarantined; index < peopleAmount; index++)
            this.people[index].still = true;

        shuffle(this.people);

        if (this.people.length > 0)
            this.people[0].infected = true;
    }

    updateSize(width, height) {
        this.worldWidth = width;
        this.worldHeight = height;
    }

    updateHealthLimit(newLimit) {
        this.healthSystemLimit = newLimit;
    }

    simulateStep() {

        let peopleInfected = 0;

        shuffle(this.people);

        for (let i = 0; i < this.people.length; i++) {

            let person = this.people[i];

            if (person.collided)
                continue;

            for (let j = i + 1; j < this.people.length; j++) {

                let person2 = this.people[j];

                if (person2 === person)
                    continue;

                person.interact(person2);

                if (person.colide)
                    break;

            }

            peopleInfected += (person.infected ? 1 : 0);

        }

        for (let person of this.people) {
            let infected = person.infected;

            person.simulate(peopleInfected, this.worldHeight, this.worldWidth, this.healthSystemLimit);

            if (infected && person.death) {
                peopleInfected -= 1;
            }
        }

    }

    getPeopleStatus() {
        let status = {
            infected: 0,
            recovered: 0,
            dead: 0,
            noInfected: 0
        };

        for (let person of this.people) {
            if (person.infected) {
                status.infected = status.infected + 1;
                continue;
            }

            if (person.recovered) {
                status.recovered = status.recovered + 1;
                continue;
            }

            if (person.death) {
                status.dead = status.dead + 1;
                continue
            }

            status.noInfected = status.noInfected + 1;
        }

        return status;
    }

    render(context) {
        for (let person of this.people)
            person.render(context);
    }
}


class Person {

    constructor(x, y) {
        this.directionX = (Math.random() * 2) - 1;
        this.directionY = (Math.random() * 2) - 1;

        this.speed = 1;

        this.x = x;
        this.y = y;
        this.collided = false;
        this.radius = RADIUS;

        this.infected = false;
        this.recovered = false;
        this.death = false;

        this.still = false;

        this.infectionCooldown = TICKS;

        this.normalizeSpeed();
    }


    simulate(infectedPeople, height, width, healthSystemLimit) {
        this.move(width, height);

        if (this.recovered)
            return;

        if (!this.infected)
            return;

        this.infectionCooldown = this.infectionCooldown - 1;

        if (this.infectionCooldown <= 0) {
            this.infected = false;
            this.recovered = true;
        }

        let chance = ((infectedPeople - healthSystemLimit)+3) / (healthSystemLimit*1000);

        if (chance > Math.random()) {
            this.infected = false;
            this.death = true;
            this.still = true;
        }
    }


    getColor() {
        if (this.death)
            return COLOR_DEAD;

        if (this.infected)
            return COLOR_INFECTED;

        if (this.recovered)
            return COLOR_RECOVERED;

        return COLOR_NORMAL;
    }


    normalizeSpeed() {
        let norm = Math.pow(this.directionY, 2) + Math.pow(this.directionX, 2);

        norm = Math.sqrt(norm);

        this.directionX = (norm === 0) ? 0 : (this.directionX / norm);
        this.directionY = (norm === 0) ? 0 : (this.directionY / norm);
    }


    render(context) {
        context.save();

        context.fillStyle = this.getColor();
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }


    move(width, height) {
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

        if (this.still && !this.collided) {
            return;
        }

        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;


        if (this.still) {
            this.speed = 1;
        }

        this.collided = false;
    }

    interact(anotherPerson) {
        let distance = Math.pow(this.x - anotherPerson.x, 2) + Math.pow(this.y - anotherPerson.y, 2)
        distance = Math.sqrt(distance);

        if (distance > RADIUS * 2)
            return;

        let x = this.x - anotherPerson.x;
        let y = this.y - anotherPerson.y;

        this.directionX = x;
        this.directionY = y;

        anotherPerson.directionX = -x;
        anotherPerson.directionY = -y;


        this.normalizeSpeed();
        anotherPerson.normalizeSpeed();

        this.collided = true;
        anotherPerson.collided = true;

        let speed = this.speed;
        this.speed = anotherPerson.speed;
        anotherPerson.speed = speed;

        if (this.infected && !(anotherPerson.infected || anotherPerson.death || anotherPerson.recovered)) {
            anotherPerson.infected = true;
        }

        if (anotherPerson.infected && !(this.infected || this.death || this.recovered)) {
            this.infected = true;
        }
    }


}

class Animation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            angle: 0,
            world: null,
            people: this.props.people,
        };
        this.updateAnimationState = this.updateAnimationState.bind(this);
    }

    componentDidMount() {
        let world = new World(this.props.width, this.props.height);
        world.populate(this.props.people, this.props.quarantinePercent);
        world.updateHealthLimit(this.props.healthSystemLimit);

        this.setState(_ => ({
            world: world
        }));

        this.rAF = requestAnimationFrame(this.updateAnimationState);
    }

    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.width !== this.props.width || newProps.height !== this.props.height)
            this.state.world.updateSize(newProps.width, newProps.height);

        if (newProps.healthSystemLimit !== this.props.healthSystemLimit)
            this.state.world.updateHealthLimit(newProps.healthSystemLimit);

        if (newProps.people !== this.props.people || newProps.quarantinePercent !== this.props.quarantinePercent) {
            this.state.world.populate(newProps.people, newProps.quarantinePercent);
            this.state.world.updateHealthLimit(newProps.healthSystemLimit);
        }
    }

    updateAnimationState() {
        let world = this.state.world;
        world.simulateStep();

        this.props.setStatus(world.getPeopleStatus());
        this.setState(prevState => ({angle: prevState.angle + 1}));
        this.rAF = requestAnimationFrame(this.updateAnimationState);
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.rAF);
    }

    render() {
        return <Canvas width={this.props.width}
                       height={this.props.height}
                       angle={this.state.angle}
                       world={this.state.world}/>
    }
}

class Canvas extends React.Component {
    constructor(props) {
        super(props);
        this.saveContext = this.saveContext.bind(this);
    }

    saveContext(ctx) {
        this.ctx = ctx;
    }

    componentDidUpdate() {
        const {angle, world} = this.props;
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.restore();

        world.render(this.ctx);
    }

    render() {
        return <PureCanvas width={this.props.width}
                           height={this.props.height}
                           angle={this.props.angle}
                           contextRef={this.saveContext}/>
    }
}

class PureCanvas extends React.Component {

    render() {
        return <canvas width={this.props.width}
                       height={this.props.height}
                       ref={node => node ? this.props.contextRef(node.getContext('2d')) : null}/>
    }
}

export default App;
