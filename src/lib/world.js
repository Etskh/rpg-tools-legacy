const {
    getMappedRecords,
    updateRecords,
    mapRecord,
    createRecords,
} = require('./airtable');

function getBiomes() {
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

const POI_REVERSE_MAPPER = (tile) => ({
    id: tile.id,
    Name: tile.name,
    ...(tile.biomeId ? {
        Biome: [
            tile.biomeId,
        ],
    } : {}),
    ...(tile.pos ? {
        Location: JSON.stringify(tile.pos),
    } : {}),
    Variance: tile.variance,
    // TODO: add the rest of the stuff
});


function getPoisWithBiome({biomes, tiles}) {
    return tiles.map(tile => {
        const biome = biomes.find(b => b.id === tile.biomeId);
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
        getBiomes(),
        getMappedRecords('POI', POI_MAPPER),
    ]).then(([biomes, tiles]) => {
        return getPoisWithBiome({
            biomes,
            tiles,
        });
    });
}





function updatePoi(tile) {
    return Promise.all([
        getBiomes(),
        updateRecords('POI', [POI_REVERSE_MAPPER(tile)]),
    ]).then(([biomes, updatedPois]) => {
        const pois = getPoisWithBiome({
            biomes,
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
    return getBiomes().then(biomes => {

        // Get a random background
        if(!tile.biomeId) {
            tile.biomeId = biomes[0].id;
        }
        if(!tile.variance) {
            tile.variance = Math.random();
        }

        return createRecords('POI', [POI_REVERSE_MAPPER(tile)]).then( createdPois => {
            const pois = getPoisWithBiome({
                biomes,
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
    getBiomes,
    createPoi,
};
