
function createBasicLayer(s, w, state){
	return {
		symbol: s, resource: w, 
		color: ("#"+((myRandomInt()%127)+127).toString(16)+((myRandomInt()%127)+127).toString(16)+((myRandomInt()%127)+127).toString(16)),
		hotkeys: [{key: s, description: `${s}: Reset for ${w}`, onPress(){if (canReset(this.layer)) doReset(this.layer)}},],

		doReset(resettingLayer){
			let keep = keepUpgradeQOL(this.layer);
			if(layers[resettingLayer].row > this.row) layerDataReset(this.layer, keep) 
		},
		layerShown() {
			if(this.row==1) return true;
			return player[this.baseResName].unlocked;
		}, 
		resetsNothing() {return hasResetNothingQOL(this.layer)},
		
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
            best: new Decimal(0),
            total: new Decimal(0)
        }},
		gainMult() {
			return getLayerMult(this.layer);
		},
		row: state.row, position: state.layer,
		
		//using only for the respec button:
		buyables: {
			showRespec: true,
			respec() {
				player[this.layer].upgrades = [];
				doReset(this.layer, true)
			},
		},
		tabFormat: {
			"Main": {
				content: [
					"main-display",
					"prestige-button",
					"blank",
					"milestones",
					"blank",
					"upgrades",
					"buyables",
				],
			},
			"Breakdown": {
				content: [["raw-html",function(){
					let eff = new Decimal(1);
					let text = `<table><caption>This Layer's Reductions</caption><thead><tr>
							<th width="100px">Effect</th>
							<th width="100px">Owner</th>
							<th width="100px">Source</th>
							<th width="300px">Source Amount</th>
						</tr></thead>`;
					//get effects from layers
					target = this.layer;
					for (let l in layers) {
						if(!tmp[l].effectTargets){continue;}
						
						for(let t of tmp[l].effectTargets){
							if(t === target){
								eff = eff.times(tmp[l].effect);
								text += `<tr><td>/${format(tmp[l].effect)}</td><td>${l}@${tmp[l].row}</td><td>${l}@${tmp[l].row}</td><td>${format(player[l].points)} ${tmp[l].resource}</td></tr>\n`;
								break;
							}
						}
					}
					text += "<tr><td>&nbsp;</td></tr>";
					//get effects from upgrades
					for (let l in layers) {
						if(!tmp[l].upgrades){continue;}
						let upgrades = [11,12,13,14,15];
						for(let u of upgrades){
							if(!hasUpgrade(l,u)){continue;}
							let upgrade = tmp[l].upgrades[u];
							if(upgrade.target === target){
								if(target === '') eff = eff.times(upgrade.effect);
								else {
									eff = eff.times(upgrade.effect);
									text += `<tr><td>/${format(upgrade.effect)}</td><td>${l}@${tmp[l].row}</td><td>${upgrade.source}@${tmp[upgrade.source].row}</td><td>${format(player[upgrade.source].points)} ${tmp[upgrade.source].resource}</tr>\n`;
								}
							}
						}
					}
					text += "<tr><td>&nbsp;</td></tr>";
					//get effects from achievements
					let achEffect = new Decimal(1.1).pow(Object.values(player.completedSeeds).filter(x => x === target).length);
					eff = eff.times(achEffect);
					text += `<tr><td>/${format(achEffect)}</td><td>&nbsp;</td><td>achievements</td><td>${Object.values(player.completedSeeds).filter(x => x === target).length} seeds</td></tr>\n`;
					text += "<tr><td>&nbsp;</td></tr>";
					text += `<tfoot><tr><td>/${format(eff)}</td><td colspan="3">Total Cost Reduction</td></tr></tfoot></table>`;
					return text;
				}]],
			},
		}
	}
}

function staticLayerStuff(state){
	return {
		type: "static",
        exponent: new Decimal(1.01), 
        base: new Decimal(1.2),
		autoPrestige(){return hasAutoPrestigeQOL(this.layer)},
		canBuyMax() {return hasCanBuyMaxQOL(this.layer)}, roundUpCost: false,
	}
}

function prestigeRequirements(r,prevRow, a){
	//row 1: always ''. Otherwise, something random from the previous row.
	let baseResNum = (r===1?"":myRandomInt()%prevRow.length);
	let baseResName = (r===1?"":prevRow[baseResNum]);
	return {
		baseResName: baseResName,
        requires(){
			return new Decimal(4);
		}, 
		action: a,
		baseResource() { return ((this.baseResName==='')?"points":(tmp[this.baseResName].resource)) },
		baseAmount() { return (this.baseResName===''?player.points:player[this.baseResName]?.points || 0) },
		resetDescription() {return `${this.action} ${this.row===1 ? 'points' : tmp[this.baseResName].resource}<br>-><br>`}
	}
}
function layerPointEffect(){
	return {
		effectTargets: [''],
        effect() {
			if(this.baseResName===''){
				return new Decimal(1).add(player[this.layer].points.times(0.02));
			}
			let upgrades = [11,12,13,14,15];
			let boughtUpgrades = upgrades.reduce((total,u) => {return total + (hasUpgrade(this.layer,u) ? 1 : 0)});
			// 1 + 0.001 *(2row + upgrades - 2targRow)
			return new Decimal(1 + Math.max(0.001, 0.001 * (2 + boughtUpgrades))).pow(player[this.layer].points);
		},
        effectDescription() { // Optional text to describe the effects
			let tg = this.baseResName;
			return tg==='' ?
				`which multiply point gain by ${format(tmp[this.layer].effect)}` : 
				`which divide the linked requirements by ${format(tmp[this.layer].effect)}`;
        },
	}
}

function createOneLayer(state, prevRow){
	let layerName = RNG_DATA.chars[myRandomInt()%RNG_DATA.chars.length];
	let layerWord = RNG_DATA.words[myRandomInt()%RNG_DATA.words.length];
	let layerAction = RNG_DATA.actions[myRandomInt()%RNG_DATA.actions.length];
	RNG_DATA.chars = RNG_DATA.chars.filter(x => x!=layerName);
	RNG_DATA.words = RNG_DATA.words.filter(x => x!=layerWord);
	
	let layerInfo = {
		...createBasicLayer(layerName, layerWord, state),
		...staticLayerStuff(state),
		...prestigeRequirements(state.row, prevRow, layerAction),
		...layerPointEffect(),
	}

	return layerInfo;
}

//QOL bonuses to add:
//order:
	//keep upgrades
	//reset nothing
	//buy max
	//auto prestige
// each achievement for that layer increases gain by 1.01x/divides req by 1.01x

function createMilestones(l){
	//milestones are just temp QOL
	//order:
	//buy max 
	//keep upgrades
	//reset nothing
	//auto prestige
	return {
		0: {requirementDescription: `1 ${l.resource}`,
			done() {return player[this.layer].best.gte(1) || Object.values(player.completedSeeds).filter(x => x === l.symbol).length > this.id}, // Used to determine when to give the milestone
			effectDescription: "Enable buy max for the previous layers.",
		},
		1: {requirementDescription: `2 ${l.resource}`,
			done() {return player[this.layer].best.gte(2) || Object.values(player.completedSeeds).filter(x => x === l.symbol).length > this.id},
			effectDescription: "Keep upgrades from the previous layers on any reset.",
		},
		2: {requirementDescription: `4 ${l.resource}`,
			done() {return player[this.layer].best.gte(4) || Object.values(player.completedSeeds).filter(x => x === l.symbol).length > this.id},
			effectDescription: "Resets on the previous layers reset nothing.",
		},
		3: {requirementDescription: `8 ${l.resource}`,
			done() {return player[this.layer].best.gte(8) || Object.values(player.completedSeeds).filter(x => x === l.symbol).length > this.id},
			effectDescription: "Auto prestige the previous layers.",
		},
	}
}

const effects = [
	{
		//increase a layer by best
		description(){
			return `Decrease ${tmp[this.target].resource} requirement based on ${tmp[this.source].resource}.`;
		},
		effect(){
			let upgrades = [11,12,13,14,15];
			let boughtUpgrades = upgrades.reduce((total,u) => {return total + (hasUpgrade(this.layer,u) ? 1 : 0)});
			// 1 + 0.001 *(2row + upgrades - 2targRow)
			return new Decimal(1 + Math.max(0.001, 0.001 * (tmp[this.source].row + tmp[this.layer].row + boughtUpgrades - tmp[this.target].row - tmp[this.target].row))).pow(player[this.source].points);
		}
	}
];
function createAnUpgrade(targets){
	let source = targets[myRandomInt()%targets.length];
	let target = targets[myRandomInt()%targets.length];
	let effect = effects[0];

	return {
		source: source,
		target: target,
		...effect,
		cost(){
			//choosable: buying one increases the costs of the others
			let count = 0; let upgrades = [11,12,13,14,15];
			for(let u of upgrades){ if(hasUpgrade(this.layer,u)){
				count++;
			}}
			return new Decimal(2).pow(count);
		},
		unlocked() { return true }, // The upgrade is only visible when this is true
		effectDisplay() { 
			if(this.target === '') return `${format(this.effect())}x`;
			return `/${format(this.effect())}`;
		},
	}
}
function createUpgrades(targets, l){
	let ids = [11,12,13,14,15];
	let result = {rows:1,cols:5};

	for(let u of ids){
		result[u] = createAnUpgrade(targets);
	}
	return result;
}

function fixRow(rowLayers, preLayers){
	//things to do after creating all the layers in the row:

	//go back and add upgrades
	let targets = [];
	for(let r of preLayers){
		for(let l of r){
			targets.push(l.symbol);
		}
	}
	for(let l of rowLayers){
		l.upgrades = createUpgrades(targets, l.symbol);
	}

	//guard against no previous layer
	if(preLayers.length < 2){return;}

	//create milestones
	for(let l of rowLayers){
		l.milestones = createMilestones(l);
	}

	//go back and add branches
	//collect connections from current row to prev row
	let collected = new Set();
	for(let l of rowLayers){
		collected.add(l.baseResName);
		l.branches = [];
		l.branches.push([l.baseResName,1]);
		l.effectTargets = [l.baseResName];
	}
	//then, create remaining qol connections from prev row to current row.
	for(let l of preLayers[preLayers.length-2]){
		if(!collected.has(l.symbol)){
			//get a random layer from rowLayers, and add the connection.
			let qolConnection = myRandomInt() % rowLayers.length;
			rowLayers[qolConnection].branches.push([l.symbol,3]);
			rowLayers[qolConnection].effectTargets.push(l.symbol);
		}
	}

}

function addFinalLayer(prevRow){

	let baseResName = prevRow[myRandomInt()%prevRow.length].symbol;
	let branches = [];
	for(let l of prevRow){
		branches.push([l.symbol,l.symbol === baseResName ? 1 : 2 ]);
	}
	addLayer('!',{
		symbol: '!', resource: "", 
		color: "#FFFFFF",

		resetDesc: 'Complete the seed!',
		doReset(resettingLayer){
			if(layers[resettingLayer].row > this.row) layerDataReset(this.layer, []) 
		},
		layerShown() {
			return player[this.baseResName]?.unlocked;
		}, 
		resetsNothing() {return false},
		
        startData() { return {
            unlocked: false,
			points: new Decimal(0),
            best: new Decimal(0),
            total: new Decimal(0),
        }},
		row: 13,

		baseResName: baseResName,
        requires(){
			return new Decimal(6);
		}, 
		baseResource() { return (tmp[this.baseResName].resource) },
		baseAmount() { return (player[this.baseResName]?.points || 0) },

		type: "normal",
		branches: branches,
		onPrestige(gain){
			player.completedSeeds[getSeed()] = this.baseResName;
		},
		prestigeButtonText(){
			return `Complete Seed #${getSeed()}`;
		},
		tabFormat: [
			"blank",
			"blank",
			"blank",
			"prestige-button"
		]
	})
}

function createSeedLayers(){
	let seed = getSeed();
	currentSeed = seed;
	let state = {};
	let preLayers = [];
	let lastRow = [''];
	let count = 1;
	let rowLayers = [];
    for(r=1; r<=12;r++){
		rowLayers = [];
		let numLayersInRow = (myRandomInt()%5)+1;
		state.numLayersInRow = numLayersInRow;
		for(l=0; l<numLayersInRow;l++){
			state.row = r;
			state.layer = l;
			let newLayer = createOneLayer(state,lastRow);
			rowLayers.push(newLayer);
			count++;
		}
		preLayers.push(rowLayers);
		lastRow = [];
		for(let l of rowLayers){
			lastRow.push(l.symbol);
		}
		fixRow(rowLayers, preLayers);
    }
	for(let newRow of preLayers){
		for(let newLayer of newRow){
			addLayer(newLayer.symbol,newLayer);
		}
	}
	console.log(count);
	addFinalLayer(rowLayers);
}

function createAchLayer(){
	addLayer('$',{
		symbol: '$', resource: 'Completed Seeds',
		color: '#FFFF00', row: 'side', baseAmount(){return Object.keys(player.completedSeeds).length},
		type: 'none',
		startData(){
			return {
				unlocked: true,
				points: new Decimal(0),
				completed: {}
			}
		},
		tooltip(){
			return `${Object.values(player.completedSeeds).length} completed seeds`
		},
		tabFormat: [
			["raw-html",function(){return `<h2>You have completed ${Object.keys(player.completedSeeds).length} seeds.</h2>`;}],
			"blank",
			["display-text","Each completion permanently unlocks a milestone in that layer, and divides its cost by 1.1 (multiplicative)"],
			["raw-html",function(){
				let effects = '';
				for(let char of RNG_DATA.allChars){
					let count = Object.values(player.completedSeeds).filter(x => x === char).length;
					if(count){
						effects += `<br>${count} ${char} completions.`
					}
				}
				return effects;
			}],
			"blank",
			["display-text",function(){
				if(!Object.keys(player.completedSeeds).length) return '';
				return 'Completed seeds: ' + Object.keys(player.completedSeeds);
			}],
		]
	})
}
createSeedLayers();
createAchLayer();