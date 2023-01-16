const redis = require('redis');

// const { redisToGoUrl, redisHost, redisPort } = require('./config');

// The Redis client to be used throughout the app.
// TODO[Zain] for sake of simplicity - let's just see what happens if I try to replace Redis
// with a "global" hashmap object

let redisClient = {};

// [Zain] old stuff
// if (redisToGoUrl) {
//     const url = require('url').parse(redisToGoUrl);
//     redisClient = redis.createClient(url.port, url.hostname);
//     redisClient.auth(url.auth.split(':')[1]);
// } else if (redisHost && redisPort) {
//     redisClient = redis.createClient(redisPort, redisHost);
// } else {
//     redisClient = redis.createClient();
// }

module.exports = redisClient;
