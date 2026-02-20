function getSeed() {
	if (window.player !== undefined) return player.seed;
	if (localStorage.getItem("seedy_tree") !== null ? JSON.parse(atob(localStorage.getItem("seedy_tree"))) !== null : false) return JSON.parse(atob(localStorage.getItem("seedy_tree"))).seed;
	return Math.ceil(Math.random()*999999999);
}

function getCompleted(){
	if (window.player !== undefined) return player.completedSeeds;
	if (localStorage.getItem("seedy_tree") !== null ? JSON.parse(atob(localStorage.getItem("seedy_tree"))) !== null : false) return JSON.parse(atob(localStorage.getItem("seedy_tree"))).completedSeeds;
	return {};
}

function getTotalTime(){
	if(window.player !== undefined) return player.totalTimePlayed;
	if (localStorage.getItem("seedy_tree") !== null ? JSON.parse(atob(localStorage.getItem("seedy_tree"))) !== null : false) return JSON.parse(atob(localStorage.getItem("seedy_tree"))).totalTimePlayed;
	return 0;
}

function getPenultimateLayer(){
	if(tmp !== undefined) return tmp['!'].baseResName;
	return '?';
}

function RNGReset() {
	let s = +prompt("Will remove progress on the current seed!\nEnter a seed (number from 1 to 999999999).");
	if (isNaN(s)) return;
	if (s<1 || s>999999999 || s!=Math.round(s)) return;
	newSeed(s);
}

function newRandomSeedWithWarning(){
	if(!confirm("Will remove progress on the current seed! Are you sure?")){return;}
	newSeed();
}
function newSeed(s) {	
	let achievements = player.completedSeeds || {};
	let time = player.totalTimePlayed;
	player = {};
	if (s) player.seed = s; else {
		let r = Math.ceil(Math.random()*999999999);
		while(achievements[r] !== undefined){
			r = Math.ceil(Math.random()*999999999);
		}
		player.seed = r;
	}
	player.completedSeeds = achievements;
	player.totalTimePlayed = time;
	save(true);
	window.location.reload();
}

const RNG_DATA = {
	chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split(''),
	allChars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split(''),
	words: [
		"anchors", "strange attractors", "leylines", "scrolls", "eggs",
		"sacrements", "judgements", "curses", "artifacts", "spirals",
		"symbols", "mushrooms", "needles", "omens", "pockets", "silences", "candles",
		"zodiacs","blood bags", "spells", "vectors", "fraternities", "chaotes",
		"insanities", "haunts", "ghasts", "terrors", "prophesies", "spawn",
		"zeniths", "magicks", "crystals", "blessings", "stars", "suns", "moons",
		"planets", "szygies", "synchonicities", "acausalities", "mysteries", "UFOs",
		"liminalities", "fractals", "backrooms", "dreams", "viscera", "bones",
		"growths", "flames", "rendezvous", "glamours", "psychics", "sparkles",
		"masks", "secrets", "illuminati", "reagents", "metals", "ciphers",
		"lairs", "volcanoes", "cosmos", "voids", "abysses", "chasms", "holes",
		"drawings", "paintings", "sigils", "runes", "ghosts", "aliens", "hearts",
		"brains", "lumps", "limbs", "machines", "devices", "dungeons","dragons",
		"desires", "temptations", "wishes", "eyes", "octopi", "mycelium", "trees",
		"fungi", "moss", "bugs", "infestations", "ruins", "infections", "mutations",
		"deities","prophets","apples", "ancients", "abstrusities", "obscurities",
		"enigmas","riddles","sphinxes","unicorns", "visions", "oddities","dolls",
		"scepters", "wands", "daggers", "cups", "lamps", "cards","lizards","problems",
		"incidents", "beans","tentacles","bonuses","orbs","levers","gears","collectibles",
		"beads","thoughts","moments","ordinals","birds","chronotons","rituals",
	],
	actions: [
		"Melt","Ionize","Electrify","Collapse","Dissolve","Crystallize","Crush",
		"Burn", "Extrude","Transform","Shape","Persuade","Reform","Stack", "Organize",
		"Build","Grow", "Sacrifice","Idolize", "Rebase", "Almagmate", "Alchemize",
		"Download"
	],
}

let currentSeed;
function linearCongruentialGenerator(){
    currentSeed = (1664525 * currentSeed + 1013904223) % 4294967296;
    return currentSeed;
}
function myRandomInt(){
	return linearCongruentialGenerator();
}
function myRandom(){
	return linearCongruentialGenerator()/4294967296;
}

function getLayerMult(target){
	let eff = new Decimal(1);
	//get effects from layers
	for (let l in layers) {
		if(!tmp[l].effectTargets){continue;}
		if(target==='' && tmp[l].row===1){eff = eff.times(tmp[l].effect); continue;}
		for(let t of tmp[l].effectTargets){
			if(t === target){
				eff = eff.div(tmp[l].effect);
				break;
			}
		}
	}
	//get effects from upgrades
	for (let l in layers) {
		if(!tmp[l].upgrades){continue;}
		let upgrades = [11,12,13,14,15];
		for(let u of upgrades){
			if(!hasUpgrade(l,u)){continue;}
			if(tmp[l].upgrades[u].target === target){
				if(target === '') eff = eff.times(tmp[l].upgrades[u].effect);
				else eff = eff.div(tmp[l].upgrades[u].effect);
			}
		}
	}
	//get effects from achievements
	eff = eff.div(new Decimal(1.1).pow(Object.values(player.completedSeeds).filter(x => x === target).length));
	return eff;
}

function keepUpgradeQOL(target){
	for (let l in layers) {
		if(!tmp[l].effectTargets){continue;}
		for(let t of tmp[l].effectTargets){
			if(t===target){
				if(hasMilestone(l,1)){
					return ['milestones','upgrades'];
				}
			}
		}
	}
	return ['milestones'];
}

function hasResetNothingQOL(target){
	for (let l in layers) {
		if(!tmp[l].effectTargets){continue;}
		for(let t of tmp[l].effectTargets){
			if(t===target){
				if(hasMilestone(l,2)){
					return true;
				}
			}
		}
	}
	return false;
}
function hasAutoPrestigeQOL(target){
	for (let l in layers) {
		if(!tmp[l].effectTargets){continue;}
		for(let t of tmp[l].effectTargets){
			if(t===target){
				if(hasMilestone(l,3)){
					return true;
				}
			}
		}
	}
	return false;
}
function hasCanBuyMaxQOL(target){
	for (let l in layers) {
		if(!tmp[l].effectTargets){continue;}
		for(let t of tmp[l].effectTargets){
			if(t===target){
				if(hasMilestone(l,0)){
					return true;
				}
			}
		}
	}
	return false;
}
