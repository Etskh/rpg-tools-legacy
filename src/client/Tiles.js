import {
    // BoxGeometry,
    Color,
    CylinderGeometry,
    Mesh,
    MeshLambertMaterial,
} from 'three';


function generateGuid() {
    return `tile:${(Math.random()*1000000).toString(16)}${Date.now().toString(16)}`;
}


function getHSL(hue, sat, light) {
    return new Color(`hsl(${hue}, ${Math.round(sat * 100)}%, ${Math.round(light * 100)}%)`);
}


function renderTile(tile) {
    const geometry = new CylinderGeometry( 0.55, 0.55, 0.2, 6 );
    const material = new MeshLambertMaterial({
        color: getHSL(tile.colour.h, tile.colour.s, tile.colour.l),
    });
    const cube = new Mesh( geometry, material );
    cube.translateX(tile.pos[0] - (tile.pos[1] % 2 === 0 ? 0 : 0.5));
    cube.translateZ(tile.pos[1] * 0.9);
    cube.name = tile.id;
    return cube;
}


function generateGridFromPois(pois) {
    function findWithOffset(tile, offset) {
        const pos = [
            tile.pos[0] + offset[0],
            tile.pos[1] + offset[1],
        ];
        const hasOffset = pois.find(poi => JSON.stringify(poi.pos) === JSON.stringify(pos));

        if(hasOffset) {
            return null;
        }
        return {
            id: generateGuid(),
            name: 'uncreated',
            state: 'uncreated',
            type: 'uncreated',
            colour: {
                h: 0,
                s: 0,
                l: 0.25,
            },
            pos,
        };
    }

    // Go around each poi, to see if we have empty slots
    const newTiles = pois.reduce((acc, tile) => {
        const adjacentTiles = tile.pos[1] % 2 === 0 ? [
            findWithOffset(tile, [-1, 0]), // left
            findWithOffset(tile, [0, -1]), // top-left
            findWithOffset(tile, [1, -1]), // top-right
            findWithOffset(tile, [1, 0]), // right
            findWithOffset(tile, [1, 1]), // bottom-right
            findWithOffset(tile, [0, 1]), // bottom-left
        ] : [
            findWithOffset(tile, [-1, 0]), // left
            findWithOffset(tile, [-1, -1]), // top-left
            findWithOffset(tile, [0, -1]), // top-right
            findWithOffset(tile, [1, 0]), // right
            findWithOffset(tile, [0, 1]), // bottom-right
            findWithOffset(tile, [-1, 1]), // bottom-left
        ];

        // Add all the ones that aren't null
        return acc.concat(adjacentTiles.filter(newPoi => !!newPoi));
    }, []);
	
    return pois.concat(newTiles.reduce((acc, tile) => {
        // IF there isn't already a tile with that position, then add it
        if(!acc.find(target => target.pos.toString() === tile.pos.toString())) {
            acc.push(tile);
        }
        return acc;
    }, []));
}



function getTiles() {
    return fetch('/api/poi/all').then(response => {
        return response.json();
    }).then(response => {
        return response.data;
    }).then(generateGridFromPois);
}

function createNewTile(tile) {
    return fetch('/api/poi', {
        method: 'PUT',
        body: JSON.stringify(tile),
    }).then(response => {
        return response.json();
    }).then(response => {
        return response.data;
    });
}


function changeBiome({biome, tile}) {
    console.log(tile);
    return fetch('/api/poi/' + tile.id, {
        method: 'POST',
        body: JSON.stringify({
            biomeId: biome.id,
        }),
    }).then(response => {
        return response.json();
    }).then(response => {
        return response.data;
    });
}


export function tileListener(action, state, dispatch) {
    if(action.type === 'READY') {
        getTiles().then(tiles => {
            dispatch({
                type: 'LOADED_TILES',
                tiles,
            });
        });
    }
    if(action.type === 'LOADED_TILES') {
        dispatch({
            type: 'ADD_SCENE_OBJECTS',
            objects: action.tiles.map(renderTile),
        });
        return {
            ...state,
            tiles: action.tiles,
        };
    }
    if(action.type === 'CLICKED_SCENE_OBJECT') {
        // We've selected an object
        dispatch({
            type: 'SELECTED_TILE',
            tile: {
                ...state.tiles.find(tile => tile.id === action.closestName),
            },
        });
        return {
            ...state,
            selected: action.closestName,
        };
    }
    else if(action.type === 'CLICKED_RENDERER') {
        dispatch({
            type: 'UNSELECTED_TILE',
        });
        return {
            ...state,
            selected: null,
        };
    }
    if(action.type === 'SELECTED_TILE') {
        return {
            ...state,
            selected: action.tile.id,
        };
    }

    if(action.type === 'CREATE_TILE') {
        // Now create a new tile from the one in the action
        const tile = state.tiles.find(tile => tile.id === action.tileId);
        createNewTile({
            ...tile,
            name: 'New Tile',
        }).then(newTile => {
            console.log('Creating tile now...', tile);
            console.log('Replacing old tile with new tile', newTile);
            dispatch({
                type: 'REMOVE_SCENE_OBJECTS',
                objectNames: [
                    tile.id,
                ],
            });
            dispatch({
                type: 'ADD_SCENE_OBJECTS',
                objects: [
                    renderTile(newTile),
                ],
            });
            dispatch({
                type: 'REPLACE_TILE',
                old: tile,
                new: newTile,
            });
            dispatch({
                type: 'SELECTED_TILE',
                tile: newTile,
            });
        });
    }
    if(action.type === 'REPLACE_TILE') {
        if(action.new.id === state.selected) {
            dispatch({
                type: 'SELECTED_TILE',
                tile: action.new,
            });
        }
        return {
            ...state,
            tiles: state.tiles.filter(tile => action.old.id !== tile.id).concat([
                action.new,
            ]),
        };
    }
    if(action.type === 'CHANGE_BIOME') {
        const oldTile = state.tiles.find(tile => tile.id === state.selected);
        changeBiome({
            tile: oldTile,
            biome: action.biome,
        }).then(newTile => {
            dispatch({
                type: 'SELECTED_TILE',
                tile: newTile,
            });
            dispatch({
                type: 'REMOVE_SCENE_OBJECTS',
                objectNames: [
                    oldTile.id,
                ],
            });
            dispatch({
                type: 'ADD_SCENE_OBJECTS',
                objects: [
                    renderTile(newTile),
                ],
            });
            dispatch({
                type: 'REPLACE_TILE',
                old: oldTile,
                new: newTile,
            });
        }).catch(err => {
            console.error(err);
        });
    }


    if(action.type === 'RENAME_TILE') {
        const selectedTile = state.tiles.find(tile => tile.id === state.selected);
        dispatch({
            type: 'REPLACE_TILE',
            old: {
                ...selectedTile,
            },
            new: {
                ...selectedTile,
                name: action.name,
            },
        });
    }
}
