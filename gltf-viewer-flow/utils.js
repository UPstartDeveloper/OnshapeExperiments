const fetch = require('node-fetch');
const { onshapeAPIRequestProxyInFlow } = require('./config');

module.exports = {

    /**
     * Send a request to the Onshape API, and proxy the response back to the caller.
     * The proxy will be found in `config.onshapeAPIRequestProxyInFlow` variable.
     * 
     * @param {Object} onshapeRequestData An object literal to parametrize the request to Onshape via Flow.
     *      @param {string} httpVerb Expected to be either: "GET", "POST", or "DELETE". See the Onshape docs for which is appropiate for your endpoint of interest: https://cad.onshape.com/glassworks/explorer.
     *      @param {Array<string>} requestUrlParameters A list of strings you wish to be joined (using slashes) to form the path of the request URL.
     *      @param {string} body a JSON string of any additional parameters to send in the request
     *      @param {Response} res The response being proxied.
     */
    forwardRequestToFlow: async (onshapeRequestData) => {
        try {
            // API request
            const reqBody = {
                "httpVerb": onshapeRequestData.httpVerb,
                "requestUrlParameters": onshapeRequestData.requestUrlParameters,
                "body": onshapeRequestData.body ? onshapeRequestData.body : {}
            };
            // TODO[Zain]: see logs to check if the JSON looks as you expect?
            console.log(`JSON sent for req body: ${JSON.stringify(reqBody)}`);
            const resp = await fetch(onshapeAPIRequestProxyInFlow, {
                method: 'POST',
                body: JSON.stringify(reqBody)
            });
            const data = await resp.text();
            const contentType = resp.headers.get('Content-Type');
            console.log(`Data returned: ${data}`)
            onshapeRequestData.res.status(resp.status).contentType(contentType).send(data);
        } catch (err) {
            onshapeRequestData.res.status(500).json({ error: err });
        }
    }
}
