// Require the framework and instantiate it
require('./src/lib/dotenv');
const fs = require('fs');
const path = require('path');
const fastify = require('fastify')({ logger: true });
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const {
  getPois,
  updatePoi,
  getBackgrounds,
  createPoi,
} = require('./src/lib/world');



function getFile(localUrl) {
  return new Promise((resolve, reject) => {
    fs.readFile(localUrl, (err, data) => {
      if(err) {
        reply.status(404);
        console.warn(err);
        return reject('?');
      }
      return resolve(data);
    });
  });
}


// Declare a route
fastify.get('/', (request, reply) => {
  reply.type('text/html');
  return getFile('./public/index.html');
})

// Declare a route
fastify.get('/random', (request, reply) => {
  reply.type('text/html');
  return getFile('./public/random.html');
})

// Declare a route
fastify.get('/index.js', (request, reply) => {
  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        reply.status(500);
        console.error(err, stats.toString());
        return reject({
          err,
        });
      }
      
      const outFile = path.resolve(webpackConfig.output.path, webpackConfig.output.filename);
      reply.type('text/javascript');
      return getFile(outFile).then( html => resolve(html));
    });
  });
});



fastify.get('/api/poi/all', (req, res) => {
	getPois().then(pois => {
		res.send({
			data: pois,
		});
	});
})

fastify.post('/api/poi/:id', (request, reply) => {
  const tile = {
    id: request.params.id,
    ...JSON.parse(request.body),
  };

  updatePoi(tile).then(updatedTile => {
    return reply.send({
      success: true,
      data: updatedTile,
    });
  });
});

fastify.put('/api/poi', (request, reply) => {
  const tile = {
    id: request.params.id,
    ...JSON.parse(request.body),
  };

  createPoi(tile).then(updatedTile => {
    return reply.send({
      success: true,
      data: updatedTile,
    });
  });
});


fastify.get('/api/biomes', (req, res) => {
	getBackgrounds().then(pois => {
		res.send({
			data: pois,
		});
	});
})



// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000)
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()