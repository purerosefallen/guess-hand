"use strict";
const moment = require("moment");
const fs = require("fs");
const yaml = require("yaml")
const sqlite3 = require("sqlite3").verbose();
const util = require("util");
const _ = require("underscore");
const exec = util.promisify(require("child_process").exec);
const constants = require("./constants.json");

let allCards = {};
let config, deck;

function sleep(ms) { 
	return new Promise((done) => {
		setTimeout(done, ms);
	});
}

async function waitUntilNextSecond() { 
	const ms = moment().toObject().milliseconds;
	if (ms) {
		await sleep(1000 - ms);
	}
}

async function readDatabase(path) { 
	console.log(`Reading database ${path} .`);
	let db = new sqlite3.Database(path, sqlite3.OPEN_READONLY);
	const data = await new Promise((resolve, reject) => { 
		db.all("select * from datas,texts where datas.id=texts.id", (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
	console.log(`${data.length} cards read from ${path} .`);
	for (let card of data) { 
		allCards[card.id] = card;
	}
}

async function readDeck(path) { 
	console.log(`Reading deck ${path} .`);
	const content = await fs.promises.readFile(path, "utf8");
	const lines = content.split("\n");
	let deck = [];
	for (let linef of lines) { 
		const line = linef.trim();
		if (_.include(["#extra", "!side"], line)) {
			break;
		}
		if (line.startsWith("#")) {
			continue;
		}
		const code = parseInt(line);
		if (code && allCards[code] && !(allCards[code].type & (constants.TYPES.TYPE_FUSION | constants.TYPES.TYPE_SYNCHRO | constants.TYPES.TYPE_XYZ | constants.TYPES.TYPE_LINK))) {
			deck.push(code);
		}
	}
	console.log(`${deck.length} cards read from ${path} .`)
	return deck;
}

async function getSequence(counts) { 
	const cmd = `./mtguess/mtguess ${counts.map(m => m.toString()).join(' ')}`;
	const out = (await exec(cmd)).stdout;
	return out.trim().split('\n').map(m => {
		return m.trim().split(' ').map((num) => { 
			return parseInt(num);
		});
	});
}

function displayDeck(deck) { 
	const deckNames = deck.map(m => {
		return allCards[m].name;
	});
	console.log(deckNames.join('\t'));
}

async function process() { 
	let counts = [deck.length];
	if (!config.first) {
		counts.unshift(config.opponentDeckCount);
	}
	await waitUntilNextSecond();
	const sequence = (await getSequence(counts))[config.first ? 0 : 1];
	const newDeck = [];
	for (let i in sequence) {
		newDeck[i] = deck[sequence[i]];
	}
	console.clear();
	displayDeck(newDeck);
	console.log("====================================");
	displayDeck(newDeck.slice(0, config.first ? 5 : 6));
}

async function main() { 
	config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf-8"));
	for (let path of config.cdb) {
		await readDatabase(path);
	}
	deck = await readDeck(config.deck);
	while (true) {
		await process();
	}
}

main();
