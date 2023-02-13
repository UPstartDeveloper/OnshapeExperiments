const fetch = require('node-fetch');
const auth = require("./authentication");
const { onshapeApiUrl } = require('./config');

/**
 * Send a request to the Onshape API, and proxy the response back to the caller.
 * 
 * @param {string} apiPath The API path to be called. This can be absolute or a path fragment.
 * @param {Request} req The request being proxied.
 * @param {Response} res The response being proxied.
 */
const forwardRequestToOnshape = async (apiPath, req, res) => {
    let data = null;
    try {
        const normalizedUrl = apiPath.indexOf(onshapeApiUrl) === 0 ? apiPath : `${onshapeApiUrl}/${apiPath}`;
        const resp = await fetch(normalizedUrl, { headers: { Authorization: `Bearer ${req.user.accessToken}` }});
        data = await resp.text();
        const contentType = resp.headers.get('Content-Type');
        res.status(resp.status).contentType(contentType).send(data);
    } catch (err) {
        if (data?.statusCode === 401) {
            auth.refreshOAuthToken(req, res).then(function() {
                forwardRequestToOnshape(apiPath, req, res);
            }).catch(function(err) {
                console.log(`Error refreshing token or making request: ${err}`);
            });
        } else {
            console.log(`${req.method} /api${req.path} error: ${data}`);
        }
        res.status(500).json({ 
            error: err,
        });
    }
}

module.exports = {
    forwardRequestToOnshape
}
