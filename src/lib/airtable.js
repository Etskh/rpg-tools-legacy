const Airtable = require('airtable');

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_KEY,
});
const base = Airtable.base(process.env.AIRTABLE_BASE);


function getFormulaForFilter(filter) {
    const filters = Object.keys(filter).map(key => {
        return `{${key}} = '${filter[key]}'`;
    }).join(', ');

    if(filters.includes(',')) {
        return `AND(${filters})`;
    }

    return filters;
}


function getRecords(name, filter) {
    const filterFormula = filter ? {
        filterByFormula: getFormulaForFilter(filter),
    } : {};

    const recordList = [];
    return new Promise((resolve, reject) => {
        base(name).select({
            view: 'Grid view',
            ...filterFormula,
        }).eachPage((records, fetchNextPage) => {
            records.forEach(record => {
                recordList.push(record);
            });
            fetchNextPage();
        }, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve(recordList);
        });
    });
}

function getChildren(childIds, children, mapper) {
    if(!childIds) {
        return [];
    }
    return childIds.map(childId => {
        const data = children.find(c => c.id === childId);
        if (!data) {
            throw new Error(`Can't find child for ${childId}`);
        }
        if(mapper) {
            return mapper(data);
        }
        return data;
    });
}

function getDirectReference(id, data, mapper) {
    const children = getChildren(id, data, mapper);
    if(children.length === 0) {
        return null;
    }
    else if(children.length > 1) {
        throw new Error('Something went fucky.', id, children);
    }

    return children[0];
}

function getText(record, texts, defaultName) {
    const text = getDirectReference(record.get('Text'), texts, data => ({
        name: data.get('en_Name'),
        shortName: data.get('en_Short Name'),
        description: data.get('en_Description'),
    }));

    if(!text) {
        return {
            name: defaultName,
            shortName: defaultName,
            description: '[description missing]',
        };
    }

    return {
        name: text.name ? text.name : defaultName,
        shortName: text.shortName ? text.shortName : text.name,
        description: text.description ? text.description : '[description missing]',
    };
}


function mapTypeToModel(model, name) {
    // If it's a reference to another class
    if(name.startsWith('ref:')) {
        const ref = model.get(name.substring(4));
        if(ref && ref.length > 0) {
            return ref[0];
        }
        return null;
    }
    else if(name.startsWith('list:')) {
        const ref = model.get(name.substring(5));
        if(ref && ref.length > 0) {
            return ref;
        }
        return null;
    }
    else if(name.startsWith('json:')) {
        const ref = model.get(name.substring(5));
        return JSON.parse(ref);
    }
	
    // Otherwise it's a model thing
    if(!model.get) {
        console.log(model);
        return model.fields[name];
    }
    return model.get(name);
}


function mapRecord(model, mapper) {
    return Object.keys(mapper).reduce((acc, cur) => {
        return {
            ...acc,
            [cur]: mapTypeToModel(model, mapper[cur]),
        };
    }, {
        id: model.id,
    });
}


function getMappedRecords(modelName, mapper) {
    return getRecords(modelName).then(models => {
        return models.map(model => mapRecord(model, mapper));
    });
}

function updateRecords(modelName, data) {
    return new Promise((resolve, reject) => {
        base(modelName).update(data.map(model => {
            const { id, ...rest } = model;
            return {
                'id': id,
                'fields': rest,
            };
        }), (err, records) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            // records.forEach(function(record) {
            // 	console.log(record.get('Name'));
            // });
            return resolve(records);
        });
    });
}


function createRecords(modelName, data) {
    return new Promise((resolve, reject) => {
        const records = data.map(model => {
            // Strip out the id from the model
            // eslint-disable-next-line no-unused-vars
            const { id, ...rest } = model;
            return {
                'fields': rest,
            };
        });

        base(modelName).create(records, (err, records) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            return resolve(records);
        });
    });
}


module.exports = {
    getRecords,
    getText,
    getDirectReference,
    getChildren,
    getMappedRecords,
    mapRecord,
    updateRecords,
    createRecords,
};