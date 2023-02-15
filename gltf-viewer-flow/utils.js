const fetch = require('node-fetch');
const { onshapeAPIRequestProxyInFlow } = require('./config');

module.exports = {

    /**
     * Send a request to the Onshape API, and proxy the response back to the caller.
     * The proxy will be found in `config.onshapeAPIRequestProxyInFlow` variable.
     * 
     * @param {string} httpVerb Expected to be either: "GET", "POST", or "DELETE". See the Onshape docs for which is appropiate for your endpoint of interest: https://cad.onshape.com/glassworks/explorer.
     * @param {Array<string>} requestUrlParameters A list of strings you wish to be joined (using slashes) to form the path of the request URL.
     * @param {Request} req The request being proxied.
     * @param {Response} res The response being proxied.
     */
    forwardRequestToFlow: async (httpVerb, requestUrlParameters, req, res) => {
        try {
            // API request
            const reqBody = {
                "httpVerb": httpVerb,
                "requestUrlParameters": requestUrlParameters
            };
            const resp = await fetch(onshapeAPIRequestProxyInFlow, {
                method: 'POST',
                body: JSON.stringify(reqBody)
            });
            const data = await resp.text();
            const contentType = resp.headers.get('Content-Type');
            res.status(resp.status).contentType(contentType).send(data);
        } catch (err) {
            res.status(500).json({ error: err });
        }
    }
}
