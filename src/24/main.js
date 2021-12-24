/**
 * @typedef {'inp'|'add'|'mul'|'div'|'mod'|'eql'} Command
 * @typedef {[number, number, number, number]} Register
 * @typedef {(register: Register, inputGenerator: () => number) => void} Instruction
 * @typedef {(input: number) => number} Program
 */

import { repeat } from 'ramda';
import { readBlocksFromStdin } from '../lib/index.js';
import { Timings } from '../lib/timings.js';

const { measure, report } = Timings();

/**
 * @returns {[string, string, string?][]}
 */
function parseInput() {
	return [...readBlocksFromStdin()]
		.map(line => line.split(' ', 3));
}

/**
 * @param {[string, string, string?][]} program
 * @returns {Program}
 */
function compile(program) {
	const toRegisterIndex = label => label.codePointAt(0) - 'w'.codePointAt(0);
	const isRegister = label => 'wxyz'.includes(label);

	/** @type {Instruction[]} */
	const instructions = program.map(([command, arg0, arg1]) => {
		const targetIndex = toRegisterIndex(arg0);

		if (command === 'inp') {
			return (register, inputGenerator) => { register[targetIndex] = inputGenerator(); };
		}

		if (isRegister(arg1)) {
			const sourceIndex = toRegisterIndex(arg1);
			switch (command) {
				case 'add': return (register) => { register[targetIndex] += register[sourceIndex]; };
				case 'mul': return (register) => { register[targetIndex] *= register[sourceIndex]; };
				case 'div': return (register) => { register[targetIndex] = Math.floor(register[targetIndex] / register[sourceIndex]); };
				case 'mod': return (register) => { register[targetIndex] %= register[sourceIndex]; };
				case 'eql': return (register) => { register[targetIndex] = register[targetIndex] === register[sourceIndex] ? 1 : 0 };
			}
		} else {
			const literal = Number(arg1);
			switch (command) {
				case 'add': return (register) => { register[targetIndex] += literal; };
				case 'mul': return (register) => { register[targetIndex] *= literal; };
				case 'div': return (register) => { register[targetIndex] = Math.floor(register[targetIndex] / literal); };
				case 'mod': return (register) => { register[targetIndex] %= literal; };
				case 'eql': return (register) => { register[targetIndex] = register[targetIndex] === literal ? 1 : 0 };
			}
		}
	});

	return (input) => {
		/** @type {Register} */ const register = [0, 0, 0, 0];
		const inputGenerator = ((input) => {
			const input_ = input.toString();
			let i = 0;
			return () => Number(input_[i++]);
		})(input);

		for (const instruction of instructions) {
			instruction(register, inputGenerator);
		}

		return register[3];
	}
}

function Machine() {
	return { register: repeat(0, 4) }
}

/**
 * @param {string} label
 */
function toRegisterIndex(label) {
	switch (label) {
		case 'w': return 0;
		case 'x': return 1;
		case 'y': return 2;
		case 'z': return 3;
	}
}

/**
 * @param {string} label
 */
function isRegister(label) {
	return toRegisterIndex(label) != null;
}

/**
 * @param {String} input
 */
function execute(input) {
	const inputGenerator = [...input].map(x => Number(x))[Symbol.iterator]();
	const machine = Machine();

	/**
	 * @param {string} label
	 * @returns {number}
	 */
	const get = label => {
		return isRegister(label) ?
				machine.register[toRegisterIndex(label)] :
				Number(label);
	};
	/**
	 * @param {string} label
	 * @param {number} value
	 */
	const set = (label, value) => machine.register[toRegisterIndex(label)] = value;

	for (const [instruction, arg0, arg1] of instructions) {
		switch (instruction) {
			case 'inp': {
				set(arg0, inputGenerator.next().value);
				break;
			}
			case 'add': {
				set(arg0, get(arg0) + get(arg1));
				break;
			}
			case 'mul': {
				set(arg0, get(arg0) * get(arg1));
				break;
			}
			case 'div': {
				set(arg0, Math.floor(get(arg0) / get(arg1)));
				break;
			}
			case 'mod': {
				set(arg0, get(arg0) % get(arg1));
				break;
			}
			case 'eql': {
				set(arg0, Number(get(arg0) === get(arg1)));
				break;
			}
		}
	}

	return machine;
}

/**
 * @param {number} previous
 * @param {number} current
 * @param {number} index
 * @returns {number}
 */
function processDigit(previous, current, index) {
	let z = previous;
	let w = current;
	let x = 0;
	let y = 0;

	x *= 0;
	x += z;
	x %= 26;

	z = Math.floor(z / [1, 1, 1, 26, 1, 1, 1, 26, 1, 26, 26, 26, 26, 26][index]);

	x += [10, 12 ,15, -9, 15, 10, 14, -5, 14, -7, -12, -10, -1, -11][index];

	x = x === w ? 1 : 0;
	x = x === 1 ? 0 : 1;

	y *= 0;
	y += 25;
	y *= x;
	y += 1;
	z *= y;
	y *= 0;
	y += w;

	y += [15, 8, 2, 6, 13, 4, 1, 9, 5, 13, 9, 6, 2, 2][index];

	y *= x;
	z += y;

	return z;
}

const instructions = parseInput();
const program = compile(instructions);

for (let i = 12345678901234; i < 12345679901234; i++) {
	measure('before', () => { execute(i.toString()) });
	measure('after', () => { program(i); });
	measure('by hand', () => [...i.toString()].map(x => Number(x)).reduce(processDigit, 0))
}

report();
