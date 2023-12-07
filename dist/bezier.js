import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';



let container;
let camera, scene, renderer;
const splineHelperObjects = [];
let splinePointsLength = 4;
const positions = [];
const wholeCurvePositions = [];
const splines = [];
const controlLines = [];

const point = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();

const geometry = new THREE.BoxGeometry( 20, 20, 20 );
let transformControl;

const ARC_SEGMENTS = 200;

let curveLine, bezierCurve;

const params = {
	addPoint: addPoint,
	removePoint: removePoint,
	animate: animate
};

init();


function init() {

	container = document.getElementById( 'container' );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 0, 250, 1000 );
	scene.add( camera );

	scene.add( new THREE.AmbientLight( 0xf0f0f0, 3 ) );
	const light = new THREE.SpotLight( 0xffffff, 4.5 );
	light.position.set( 0, 1500, 200 );
	light.angle = Math.PI * 0.2;
	light.decay = 0;
	light.castShadow = true;
	light.shadow.camera.near = 200;
	light.shadow.camera.far = 2000;
	light.shadow.bias = - 0.000222;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;
	scene.add( light );

	const planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
	planeGeometry.rotateX( - Math.PI / 2 );
	const planeMaterial = new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.2 } );

	const plane = new THREE.Mesh( planeGeometry, planeMaterial );
	plane.position.y = - 200;
	plane.receiveShadow = true;
	scene.add( plane );

	const helper = new THREE.GridHelper( 2000, 100 );
	helper.position.y = - 199;
	helper.material.opacity = 0.25;
	helper.material.transparent = true;
	scene.add( helper );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	const gui = new GUI();

	gui.add( params, 'addPoint' );
	gui.add( params, 'removePoint' );
	gui.add( params, 'animate' );
	gui.open();

	// Controls
	const controls = new OrbitControls( camera, renderer.domElement );
	controls.damping = 0.2;
	controls.addEventListener( 'change', render );

	transformControl = new TransformControls( camera, renderer.domElement );
	transformControl.addEventListener( 'change', render );
	transformControl.addEventListener( 'dragging-changed', function ( event ) {

		controls.enabled = ! event.value;

	} );
	scene.add( transformControl );

	transformControl.addEventListener( 'objectChange', function () {

		updateSplineOutline();

	} );

	document.addEventListener( 'pointerdown', onPointerDown );
	document.addEventListener( 'pointerup', onPointerUp );
	document.addEventListener( 'pointermove', onPointerMove );
	window.addEventListener( 'resize', onWindowResize );

	for ( let i = 0; i < splinePointsLength; i ++ ) {

		addSplineObject( positions[ i ] );

	}

	positions.length = 0;

	for ( let i = 0; i < splinePointsLength; i ++ ) {

		positions.push( splineHelperObjects[ i ].position );

	}

	wholeCurvePositions.push(positions);

	let bezierCurve = new THREE.CubicBezierCurve3(
	    new THREE.Vector3( -100, 0, 40 ),
	    new THREE.Vector3( -50, 150, -30 ),
	    new THREE.Vector3( 200, 150, 50 ),
	    new THREE.Vector3( 100, 0, 100 )
	);
	const points = bezierCurve.getPoints( 200 );
	const geometry = new THREE.BufferGeometry().setFromPoints( points );

	const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

	curveLine = new THREE.Line( geometry, material );

	scene.add(curveLine);	
	splines.push(curveLine);

	load( [ 
		new THREE.Vector3( -100, 0, 40 ),
	    new THREE.Vector3( -50, 150, -30 ),
	    new THREE.Vector3( 200, 150, 50 ),
	    new THREE.Vector3( 100, 0, 100 )
	] );


	addControlLines( positions );

	render();

}

function addControlLines( position ) {

	const controlLineMaterial = new THREE.LineDashedMaterial( {
		color: Math.random() * 0xffffff,
		linewidth: 3,
		scale: 10,
		dashSize: 10,
		gapSize: 10,
	} );

	let controlLinePoints = [position[0], position[1]];
	const controlLineGeometry = new THREE.BufferGeometry().setFromPoints( controlLinePoints );

	let firstControlLine = new THREE.Line( controlLineGeometry, controlLineMaterial );
	firstControlLine.computeLineDistances();

	scene.add( firstControlLine );
	controlLines.push( firstControlLine );

	controlLinePoints = [position[2], position[3]]
	const controlLineGeometry2 = new THREE.BufferGeometry().setFromPoints( controlLinePoints );

	let secondControlLine = new THREE.Line( controlLineGeometry2, controlLineMaterial );
	secondControlLine.computeLineDistances();

	scene.add( secondControlLine );
	controlLines.push( secondControlLine );

	console.log(controlLines);

}


function addSplineObject( position ) {

	const material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
	const object = new THREE.Mesh( geometry, material );

	if ( position ) {

		object.position.copy( position );

	} else {

		object.position.x = Math.random() * 1000 - 500;
		object.position.y = Math.random() * 600;
		object.position.z = Math.random() * 800 - 400;

	}

	object.castShadow = true;
	object.receiveShadow = true;
	scene.add( object );
	splineHelperObjects.push( object );
	return object;

}

function addPoint() {

	splinePointsLength += 3;

	let newPoint = new THREE.Vector3(Math.random() * 1000 - 500, Math.random() * 600, Math.random() * 800 - 400) ;

	let newCurvePositions = [];

	newCurvePositions.push( wholeCurvePositions[wholeCurvePositions.length-1][3] );

	let vec1 = calculateFirstControlPoint( wholeCurvePositions[wholeCurvePositions.length-1][3], wholeCurvePositions[wholeCurvePositions.length-1][2] );
	newCurvePositions.push( addSplineObject(vec1).position );

	let vec2 = calculateSecondControlPoint(wholeCurvePositions[wholeCurvePositions.length-1][3], wholeCurvePositions[wholeCurvePositions.length-1][2], newPoint)
	newCurvePositions.push( addSplineObject(vec2).position );

	newCurvePositions.push( addSplineObject(newPoint).position );

	wholeCurvePositions.push(newCurvePositions);


	addControlLines( newCurvePositions );


	let newBezierCurve = new THREE.CubicBezierCurve3(
		newCurvePositions[0],
		newCurvePositions[1],
		newCurvePositions[2],
		newCurvePositions[3],
	);
	const newPoints = newBezierCurve.getPoints( 200 );
	const newGeometry = new THREE.BufferGeometry().setFromPoints( newPoints );

	const newMaterial = new THREE.LineBasicMaterial( { color: 0xff0000 } );

	let newCurveLine = new THREE.Line( newGeometry, newMaterial );

	splines.push(newCurveLine);
	scene.add(newCurveLine);

	updateSplineOutline();

	render();

}

function calculateFirstControlPoint(v1, v2) {
	let x1 = v1.x - v2.x;
	let y1 = v1.y - v2.y;
	let z1 = v1.z - v2.z;

	return new THREE.Vector3(v1.x + x1, v1.y + y1, v1.z + z1);
}

function calculateSecondControlPoint(v1, v2, w1) {
	let x1 = v1.x - (v1.x-w1.x)/2;
	let y1 = v1.y - (v1.y-w1.y)/2;
	let z1 = v1.z - (v1.z-w1.z)/2;

	let x2 = -v2.x - 2*x1;
	let y2 = -v2.y - 2*y1;
	let z2 = -v2.z - 2*z1;

	let point = new THREE.Vector3(x2, y2, z2);
	point.clamp(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2000, 2000, 2000));
	return point;
}

function removePoint() {

	if ( splinePointsLength <= 4 ) {

		return;

	}

	const point = splineHelperObjects.pop();
	const controlPoint = splineHelperObjects.pop();
	const controlPoint2 = splineHelperObjects.pop();
	splinePointsLength -= 3;

	wholeCurvePositions.pop();
	const curve = splines.pop();

	const firstControlLine = controlLines.pop();
	const secondControlLine = controlLines.pop();

	if ( transformControl.object === point ) transformControl.detach();
	scene.remove( point );
	scene.remove( controlPoint );
	scene.remove( controlPoint2 );
	scene.remove( curve );
	scene.remove( firstControlLine );
	scene.remove( secondControlLine );


	updateSplineOutline();

	render();

}

function updateSplineOutline() {

	if(wholeCurvePositions.length > 0) {
		for (let i = 0; i < wholeCurvePositions.length; i++) {
			let curvePoints = wholeCurvePositions[i];
			curveLine = new THREE.CubicBezierCurve3(curvePoints[0], curvePoints[1], curvePoints[2], curvePoints[3]);
			const points = curveLine.getPoints( 200 );
			splines[i].geometry.setFromPoints(points);

			if( controlLines.length > 0 ) {
				let index = 2*i;
				let controlPoints = [curvePoints[0], curvePoints[1]];
				let controlPoints2 = [curvePoints[2], curvePoints[3]];
				console.log(controlLines);
				console.log(index);
				controlLines[index].geometry.setFromPoints( controlPoints );
				controlLines[index + 1].geometry.setFromPoints( controlPoints2 );
			}
			
		}	
	}
	

}

function animate() {

	requestAnimationFrame( animate );

	// positions.forEach(position => {
		

	// 	let x = 0, y = 0, z = 0; 
	// 	x += ( Math.random() - 0.5 ) * 10; 
	// 	// y += ( Math.random() - 0.5 ) * 3; 
	// 	// z += ( Math.random() - 0.5 ) * 3;
	// 	position.x += x;
	// 	position.y += y;
	// 	position.z += z;


	// });

	updateSplineOutline();
	render();

}

function load( new_positions ) {

	while ( new_positions.length > positions.length ) {

		addPoint();

	}

	while ( new_positions.length < positions.length ) {

		removePoint();

	}

	for ( let i = 0; i < positions.length; i ++ ) {

		positions[ i ].copy( new_positions[ i ] );

	}

	updateSplineOutline();

	render();

}



function render() {

	renderer.render( scene, camera );

}





function onPointerDown( event ) {

	onDownPosition.x = event.clientX;
	onDownPosition.y = event.clientY;

}

function onPointerUp( event ) {

	onUpPosition.x = event.clientX;
	onUpPosition.y = event.clientY;

	if ( onDownPosition.distanceTo( onUpPosition ) === 0 ) {

		transformControl.detach();
		render();

	}

}

function onPointerMove( event ) {

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( pointer, camera );

	const intersects = raycaster.intersectObjects( splineHelperObjects, false );

	if ( intersects.length > 0 ) {

		const object = intersects[ 0 ].object;

		if ( object !== transformControl.object ) {

			transformControl.attach( object );

		}

	}

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	render();

}

		