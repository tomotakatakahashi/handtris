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
    element: document.body,
    engine: engine,
    options: {width: 400, height:600}
});


var touchable = 1;
var boundary = 2;
var wall = 4;

function createTetrimino(type){
    const x = 200, y = -100, size = 25;
    var ret = Composite.create();
    var bodies = [];
    var option = {
	collisionFilter: {
	    category: touchable,
	    mask: touchable | boundary | wall
	},
	frictionAir: 0.2,
	constraints: []
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
	    option.constraints = [];
	    bodies.push(Bodies.rectangle(x + ((i % 3) ? size : 0), y + ((i & 2)? size: 0), size, size, option));
	}
	Composite.add(ret, bodies);
	for(var i = 0; i < 4; i++){
	    var constraint = Constraint.create({bodyA: bodies[i], bodyB: bodies[(i+1) % 4]});
	    Composite.add(ret, constraint);
	    bodies[i].constraints.push(constraint);
	    bodies[(i+1)%4].constraints.push(constraint);
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

console.log(ground.collisionFilter);

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
	//console.log(pair.bodyA.refToPar);
	//console.log(pair.bodyB.refToPar);
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
	Composite.remove(nowMino, Composite.allConstraints(nowMino));
	
	nowMino = createTetrimino('O');
	nowMino.bodies.forEach(function(body){
	    minos.push(body);
	});
	World.add(engine.world, nowMino);

	var start = Vector.create(70, 570);
	var end = Vector.create(330, 570);
	var collisions = Query.ray(minos, start, end);
	console.log(collisions.length);
	console.log(minos.length);
	if(collisions.length >= 5){
	    collisions.forEach(function(collision){
		collision.body.refToPar.bodies.forEach(function(body){
		    if(body === collision.body){
			Composite.remove(body.refToPar, body);
		    }
		});
		for(var i = 0; i < minos.length; i++){
		    if(minos[i] === collision.body){
			minos.splice(i, 1);
			break;
		    }
		}

		/*
		World.remove(engine.world, collision.body.refToPar);
		collision.body.refToPar.bodies.forEach(function(body){
		    for(var i = 0; i < minos.length; i++){
			if(minos[i] === body){
			    minos = minos.splice(i, 1);
			    break;
			}
		    }
		});
		*/
	    });
	    console.log(collisions);
	    /*
	    var removed = new Set();
	    collisions.forEach(function(collision){
		removed.add(collision.body.refToPar);
	    });
	    removed.forEach(function(comp){
		World.remove(engine.world, comp);
		Composite.clear(comp, false, false);
	    });
	    console.log(collisions);
	    */
	    /*
	    var removed = Composite.create();
	    collisions.forEach(function(collision){
		collision.body.constraints.forEach(function(constraint){
		    Composite.add(removed, constraint);
		});
		Composite.add(removed, collision.body);
	    });
	    console.log(removed);
	    World.remove(engine.world, removed);
*/
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
console.log(mouseConstraint.collisionFilter);
console.log(mouse.id);
render.mouse = mouse;
World.add(world, mouseConstraint);
render.mouse = mouse;
