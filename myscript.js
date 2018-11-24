// module aliases
var Engine = Matter.Engine,
    Events = Matter.Events,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Common = Matter.Common,
    Composite = Matter.Composite,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Body = Matter.Body,
    Query = Matter.Query,
    Vector = Matter.Vector;

// create an engine
var engine = Engine.create(),
    world = engine.world;

// create a renderer
var render = Render.create({
    element: document.getElementById("game-aria"),
    engine: engine,
    options: {width: 400, height:600}
});
// https://tyfkda.github.io/blog/2014/11/01/full-canvas.html
if(window.innerWidth / window.innerHeight >= 400/600){
    render.canvas.style.width = window.innerHeight * 0.95 / 600 * 400 + "px";
    render.canvas.style.height = window.innerHeight * 0.95 + "px";
}else{
    render.canvas.style.width = window.innerWidth * 0.95 + "px";
    render.canvas.style.height = window.innerWidth * 0.95 / 400 * 600 + "px";
}

var touchable = 1;
var boundary = 2;
var wall = 4;

const minoKinds = ["O", "I", "T"];
function createTetrimino(type){
    const x = 200, y = -100, size = 25;
    var ret = Composite.create();
    var bodies = [];
    var option = {
	collisionFilter: {
	    category: touchable,
	    mask: touchable | boundary | wall
	},
	frictionAir: 0.1
    };
    switch(type){
    case 'I':
	for(var i = 0; i < 4; i++){
	    bodies.push(Bodies.rectangle(x + i * size, y, size, size, option));
	}
	Composite.add(ret, bodies);
	for(var i = 1; i < 4; i++){
	    Composite.add(ret, Constraint.create({bodyA: bodies[i-1], bodyB: bodies[i]}));
	}
	break;
    case 'O':
	for(var i = 0; i < 4; i++){
	    bodies.push(Bodies.rectangle(x + ((i % 3) ? size : 0), y + ((i & 2)? size: 0), size, size, option));
	}
	Composite.add(ret, bodies);
	for(var i = 0; i < 4; i++){
	    var constraint = Constraint.create({bodyA: bodies[i], bodyB: bodies[(i+1) % 4]});
	    Composite.add(ret, constraint);
	}
	break;
    case "T":
	var dx = [0, -size, 0, +size];
	var dy = [0, 0, -size, 0];
	for(var i = 0; i < 4; i++){
	    bodies.push(Bodies.rectangle(x + dx[i], y + dy[i], size, size, option));
	}
	Composite.add(ret, bodies);
	for(var i = 1; i < 4; i++){
	    Composite.add(ret, Constraint.create({bodyA: bodies[0], bodyB: bodies[i]}));
	}
	break;
	    
    }
    for(var i = 0; i < 4; i++){
	bodies[i].refToPar = ret;
    }
    return ret;
}



var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true , collisionFilter: {category: boundary, mask: touchable | boundary | wall}});
var wallOption = {isStatic: true, collisionFilter: {category: wall, mask: touchable | boundary | wall}};
var leftWall = Bodies.rectangle(70, 300, 10, 600, wallOption);
var rightWall = Bodies.rectangle(330, 300, 10, 600, wallOption);


var minos = [];
// add all of the bodies to the world
var nowMino = createTetrimino("O");
nowMino.bodies.forEach(function(body){
    minos.push(body);
});
World.add(engine.world, [ground, leftWall, rightWall, nowMino]);
Events.on(engine, "collisionStart", function(e){
    var renew = false;
    e.pairs.forEach(function(pair){
	var bodies = [[pair.bodyA, pair.bodyB], [pair.bodyB, pair.bodyA]];
	bodies.forEach(function(bodies){
	    var [bodyA, bodyB] = bodies;
	    if(bodyA.collisionFilter.category == touchable && bodyB.collisionFilter.category == boundary){
		renew = true;
	    }

	});
    });
    if(renew){
	console.log("renew!");
	nowMino.bodies.forEach(function(body){
	    body.collisionFilter.category = boundary;
	});
	//Composite.remove(nowMino, Composite.allConstraints(nowMino));

	var minoKind = minoKinds[Math.floor(Math.random() * 3)];
	nowMino = createTetrimino(minoKind);
	nowMino.bodies.forEach(function(body){
	    minos.push(body);
	});
	World.add(engine.world, nowMino);

	for(var y = 570; y >= 0; y--){
	    var start = Vector.create(70, y);
	    var end = Vector.create(330, y);
	    var collisions = Query.ray(minos, start, end);

	    if(collisions.length > 0 && y == 0){
		//Engine.clear(engine);
		Composite.clear(world);
		alert("Game over!");
	    }
	    if(collisions.length >= 15){
		collisions.forEach(function(collision){
		    collision.body.refToPar.bodies.forEach(function(body){
			if(body === collision.body){
			    Composite.remove(body.refToPar, body);
			}
		    });
		    var removedConstraints = [];
		    collision.body.refToPar.constraints.forEach(function(constraint){
			if(constraint.bodyA === collision.body || constraint.bodyB === collision.body){
			    removedConstraints.push(constraint);
			}
		    });
		    Composite.remove(collision.body.refToPar, removedConstraints);
		    for(var i = 0; i < minos.length; i++){
			if(minos[i] === collision.body){
			    minos.splice(i, 1);
			    break;
			}
		    }
		    
		});
	    }
	}
    }
});


// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);


var mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
	mouse: mouse,
	constraint: {
	    stiffness: 0.2,
	    render: {
		visible: false
	    }
	},
	collisionFilter: {
	    category: touchable,
	    mask: touchable
	}
    });
render.mouse = mouse;
World.add(world, mouseConstraint);
