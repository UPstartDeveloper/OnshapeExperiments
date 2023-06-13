const { LRUCache } = require('lru-cache');

/* In-memory storage for configuration settings set by the user. */
let appSettings = new LRUCache({ max: 500 });

/* In-memory storage for translation jobs. */
const translatedFilesOptions = {
    // At least one of 'max', 'ttl', or 'maxSize' is required, to prevent unsafe unbounded storage.
    max: 500,  
    // how long to live in ms
    ttl: 1000 * 60 * 5, // 5 min, since we're just testing
};

let translatedFiles = new LRUCache(translatedFilesOptions);

module.exports = {
    "appSettings": appSettings,
    "translatedFiles": translatedFiles
};
