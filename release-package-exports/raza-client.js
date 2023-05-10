const { LRUCache } = require('lru-cache');


const options = {
    // At least one of 'max', 'ttl', or 'maxSize' is required, to prevent unsafe unbounded storage.
    max: 500,  
    // how long to live in ms
    ttl: 1000 * 60 * 5, // 5 min, since we're just testing
};

/* In-memory storage for configuration settings set by the user. */
let appSettings = new LRUCache(options);
/* In-memory storage for translation jobs. */
let translatedFiles = new LRUCache(options);

module.exports = {
    "appSettings": appSettings,
    "translatedFiles": translatedFiles
};
