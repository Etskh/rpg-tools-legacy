import {
    Button,
    Text,
    Title,
    createElement,
} from './Core';


function getBiomes() {
    return fetch('/api/biomes').then(response => {
        return response.json();
    }).then(response => response.data);
}



const BiomeSelector = (onSelect) => {
    const onSelectBiome = (biome) => {
        return () => {
            onSelect(biome);
        };
    };

    return createElement({
        methods: (dom) => ({
            updateBiomes: (biomes) => {
                dom.innerHTML = '';
                biomes.forEach(biome => {
                    const biomeButton = Button(biome.name, onSelectBiome(biome), {
                        style: {
                            cursor: 'pointer',
                            color: biome.light > 0.5 ? 'black' : 'white',
                            background: `hsl(${biome.hue}, ${biome.sat*100}%, ${biome.light*100}%)`,
                        },
                    });
                    dom.appendChild(biomeButton.dom);
                });
            }, 
        }),
    });
};


export default (store, dispatch) => {
    const defaultUnselectedText = 'Select a tile to view information';
    const title = Title('', {
        onClick: (ev) => {
            const newName = prompt('New name for tile', ev.target.innerText);
            if(newName) {
                dispatch({
                    type: 'RENAME_TILE',
                    name: newName,
                });
            }
        },
    });
    const tileType = Text(''); // Town/Encounter/POI/Uneventful
    const idField = Text(defaultUnselectedText);
    const button = Button('action', (ev) => {
        if(ev.target.innerText === 'Create Tile') {
            dispatch({
                type: 'CREATE_TILE',
                tileId: store.get('selected'),
            });
        }
    });
    const biomeSelector = BiomeSelector((biome) => {
        dispatch({
            type: 'CHANGE_BIOME',
            biome,
        });
    });
    biomeSelector.hide();
    title.hide();


    const selectedTile = (tile) => {
        title.setText(tile.name);
        idField.setText(JSON.stringify(tile.pos));
        // if(tile.npcs) {
        // npcList.setText('NPCS: ' + tile.npcs.join(', '));
        // }
        // else {
        // 	npcList.setText('');
        // }
        if(tile.state === 'uncreated') {
            button.setText('Create Tile');
            button.show();
            biomeSelector.hide();
            title.hide();
            tileType.hide();
        }
        else {
            button.hide();
            biomeSelector.show();
            title.show();
            tileType.show();
            tileType.setText(tile.type ? tile.type : 'Uneventful');
        }
    };
    const unselectedTile = () => {
        idField.setText(defaultUnselectedText);
        button.hide();
        biomeSelector.hide();
        title.hide();
        tileType.hide();
    };

    // return createElement({
    // 	children: [],
    // });
    return createElement({
        style: {
            position: 'absolute',
            right: 0,
            'width': '10em',
            'background-color': 'rgba(0,0,0,0.5)',
            padding: '0.5em',
        },
        children: [
            title,
            idField,
            tileType,
            // npcList,
            biomeSelector,
            button,
        ],
        onPostRender: () => {
            button.hide();
        },
        onUpdate: (action) => {
            if(action.type === 'SELECTED_TILE') {
                selectedTile(action.tile);
            }
            if(action.type === 'UNSELECTED_TILE') {
                unselectedTile();
            }
            if(action.type === 'READY') {
                getBiomes().then(biomes => {
                    biomeSelector.updateBiomes(biomes);
                });
            }
        },
    });
};

