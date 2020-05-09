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
let config, deck, wish;

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

async function getSequence(offset, counts) { 
	const cmd = `./mtguess/mtguess ${offset} ${counts.map(m => m.toString()).join(' ')}`;
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

async function getSingleDeck(offset, deck) { 
	let counts = [deck.length];
	if (!config.first) {
		counts.unshift(config.opponentDeckCount);
	}
	const sequence = (await getSequence(++offset, counts))[config.first ? 0 : 1];
	const newDeck = [];
	for (let i in sequence) {
		newDeck[i] = deck[sequence[i]];
	}
	return newDeck;
}

async function process() { 
	await waitUntilNextSecond();
	let offset = 0;
	let decks = [];
	while (true) { 
		const single = await getSingleDeck(offset, deck);
		decks[offset++] = single;
		const hand = single.slice(0, 5);
		if (!wish || await wish({
			deck: single,
			hand,
			first: config.first
		}))
			break;
	}
	console.clear();
	displayDeck(decks[0]);
	console.log("========================");
	const hand = decks[0].slice(0, 5);
	displayDeck(hand);
	if (wish) {
		const ok = decks.length === 1;
		console.log("========================");
		console.log(ok ? "OK" : `Remaining: ${decks.length - 1}`);
		return ok && config.exitWhenWish;
	}
	return false;
}

async function main() { 
	config = yaml.parse(await fs.promises.readFile("./config.yaml", "utf-8"));
	if (config.wishScript) { 
		wish = require(config.wishScript);
		console.log(`Loaded wish script ${config.wishScript} .`);
	}
	await Promise.all(config.cdb.map(readDatabase));
	deck = await readDeck(config.deck);
	while (!await process());
}

main();
