const {
    getMappedRecords,
    updateRecords,
    mapRecord,
    createRecords,
} = require('./airtable');

function getBackgrounds() {
    return getMappedRecords('Biome', {
        name: 'Name',
        hue: 'Hue',
        sat: 'Saturation',
        light: 'Lighting',
        variance: 'Variance',
    });
}


const POI_MAPPER = {
    name: 'Name',
    biomeId: 'ref:Biome',
    type: 'Type',
    pos: 'json:Location',
    npcs: 'list:NPC',
    variance: 'Variance',
};

// {
// 	"Name": "Town of Wealdhold",
// 	"Background": [
// 		"rec1U3kHaG2rjFqyn"
// 	],
// 	"Type": "Town",
// 	"Location": "[0, 0]",
// 	"NPC": [
// 		"recudGSoZtcZ8ALoH",
// 		"recTKyNjobIQXE2sy"
// 	],
// 	"Variance": 0.8,
// 	"Deco": [
// 		{
// 		"id": "atty2Y3Dkn3sWICtj"
// 		}
// 	]
// }
const POI_REVERSE_MAPPER = (tile) => ({
    id: tile.id,
    Name: tile.name,
    ...(tile.biomeId ? {
        Background: [
            tile.biomeId,
        ],
    } : {}),
    ...(tile.pos ? {
        Location: JSON.stringify(tile.pos),
    } : {}),
    Variance: tile.variance,
    // TODO: add the rest of the stuff
});


function getPoisWithBackground({backgrounds, tiles}) {
    return tiles.map(tile => {
        const biome = backgrounds.find(b => b.id === tile.biomeId);
        if(!biome) {
            console.warn('Unknown biome for tile');
            return null;
        }
        const variance = 1 + (tile.variance * biome.variance/2) - biome.variance;
        return {
            ...tile,
            biome,
            colour: {
                h: Math.round(biome.hue * variance),
                s: biome.sat * variance,
                l: biome.light * variance,
            },
        };
    }).filter(tile => !!tile);
}


function getPois() {
    return Promise.all([
        getBackgrounds(),
        getMappedRecords('POI', POI_MAPPER),
    ]).then(([backgrounds, tiles]) => {
        return getPoisWithBackground({
            backgrounds,
            tiles,
        });
    });
}





function updatePoi(tile) {
    return Promise.all([
        getBackgrounds(),
        updateRecords('POI', [POI_REVERSE_MAPPER(tile)]),
    ]).then(([backgrounds, updatedPois]) => {
        const pois = getPoisWithBackground({
            backgrounds,
            tiles: updatedPois.map(tile => mapRecord(tile, POI_MAPPER)),
        });

        if(pois.length === 0) {
            return Promise.reject('No POIs could be retrieved');
        }
        // Return the one that we did update
        return pois[0];
    });
}


function createPoi(tile) {
    return getBackgrounds().then(backgrounds => {

        // Get a random background
        if(!tile.biomeId) {
            tile.biomeId = backgrounds[0].id;
        }
        if(!tile.variance) {
            tile.variance = Math.random();
        }

        return createRecords('POI', [POI_REVERSE_MAPPER(tile)]).then( createdPois => {
            const pois = getPoisWithBackground({
                backgrounds,
                tiles: createdPois.map(tile => mapRecord(tile, POI_MAPPER)),
            });

            if(pois.length === 0) {
                return Promise.reject('No POIs could be created');
            }
            // Return the one that we did update
            return pois[0];
        });
    });
}


module.exports = {
    getPois,
    updatePoi,
    getBackgrounds,
    createPoi,
};
