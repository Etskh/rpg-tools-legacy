
const keyState = {};

const keyCodes = {
	LEFT_ARROW: 37,
	UP_ARROW: 38,
	RIGHT_ARROW: 39,
	DOWN_ARROW: 40,
};

const mappings = {
	'Up': [
		keyCodes.UP_ARROW,
	],
	'Left': [
		keyCodes.LEFT_ARROW,
	],
	'Right': [
		keyCodes.RIGHT_ARROW,
	],
	'Down': [
		keyCodes.DOWN_ARROW,
	],
}

// TODO: fix me - hacky but... it works
window.addEventListener('keydown', (ev) => {
	keyState[ev.keyCode] = true;
	// console.log(ev.keyCode);
});
// TODO: fix me - hacky but... it works
window.addEventListener('keyup', (ev) => {
	keyState[ev.keyCode] = false;
});

export function isDown(name) {
	if(!mappings[name]) {
		throw new Error(`${name} is an unknown input mapping`);
	}
	return mappings[name].reduce((acc, keyCode) => acc || keyState[keyCode], false);
}