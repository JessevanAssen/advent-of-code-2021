/**
 * @typedef {'inp'|'add'|'mul'|'div'|'mod'|'eql'} Command
 */

import { repeat } from 'ramda';
import { readBlocksFromStdin } from '../lib/index.js';

/**
 * @returns {[Command, string, string?][]}
 */
function parseInput() {
	return [...readBlocksFromStdin()]
		.map(line => line.split(' ', 3));
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
				set(arg0, Math.round(get(arg0) / get(arg1)));
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


const instructions = parseInput();

for (let i = 99999999999999; i >= 9999999999999; i--) {
	if (i.toString().includes('0')) { continue; }

	if (execute(i.toString()).register[3] === 0) {
		console.log(i);
		break;
	}
}
