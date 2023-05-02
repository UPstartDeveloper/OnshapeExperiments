const fetch = require('node-fetch');
const { accessKey, onshapeAPIRequestProxyInFlow, secretKey } = require('./config');

module.exports = {

    /**
     * Send a request to the Onshape API, and proxy the response back to the caller.
     * The proxy will be found in `config.onshapeAPIRequestProxyInFlow` variable.
     * 
     * @param {Object} onshapeRequestData An object literal to parametrize the request to Onshape via Flow.
     *      @param {string} httpVerb Expected to be either: "GET", "POST", or "DELETE". See the Onshape docs for which is appropiate for your endpoint of interest: https://cad.onshape.com/glassworks/explorer.
     *      @param {string} requestUrlParameters Forms the path of the request URL.
     *      @param {Object} body a JSON object literal of any additional parameters to send in the request
     *      @param {Response} res The response being proxied.
     */
    forwardRequestToFlow: async (onshapeRequestData) => {
        try {
            const encodedString = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
            // API request
            const flowRequestBody = JSON.stringify({
                "httpVerb": onshapeRequestData.httpVerb,
                "requestUrlParameters": onshapeRequestData.requestUrlParameters,
                "onshapeRequestBody": onshapeRequestData.body ? onshapeRequestData.body : {},
                "basicAuthString": encodedString
            });
            const resp = await fetch(onshapeAPIRequestProxyInFlow, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: flowRequestBody
            });
            if (!onshapeRequestData.res) {
                return resp;  // let the caller resolve the Promise
            }
            const data = await resp.text();
            const contentType = resp.headers.get('Content-Type');
            console.log(`Content type: ${contentType}`);
            console.log(`Request body passed: ${flowRequestBody}`);
            console.log(`Data returned: ${data}`)
            onshapeRequestData.res.status(resp.status).contentType(contentType).send(data);
        } catch (err) {
            onshapeRequestData.res.status(500).json({ error: err });
        }
    },

    /**
     * Webhook notifications from Onshape will include the below string,
     * when it occurs due to a revision or release package transition 
     * through workflow states.
     * 
     * For more on the event types enumerated by the Onshape API, please see:
     * https://onshape-public.github.io/docs/webhook/
     */
    ONSHAPE_WORKFLOW_EVENT: "onshape.workflow.transition",

    /**
     * At the time we register a webhook in Onshape (by POST'ing to /webhooks),
     * Onshape will immediately "test" out our callback URL, by sending a notification
     * with the following event type.
     * 
     * For more on the event types enumerated by the Onshape API, please see:
     * https://onshape-public.github.io/docs/webhook/
     */
    ONSHAPE_WEBHOOK_REGISTRATION_EVENT: "webhook.register",

    /**
     * Webhook notifications from Onshape will include the below string,
     * when it occurs due to some CAD model stored in a document
     * (e.g. an assembly), being converted into a particular 3D file format. 
     * 
     * For more on the event types enumerated by the Onshape API, please see:
     * https://onshape-public.github.io/docs/webhook/
     */
    ONSHAPE_MODEL_TRANSLATION_COMPLETED_EVENT: "onshape.model.translation.complete",

    /** 
     * Arbitrary string we use as an intermediary value in our data store,
     * to communicate that a translation is currently being processed on
     * Onshape's servers.
     */
    ONSHAPE_MODEL_TRANSLATION_STATE_IN_PROGRESS: "in-progress",

    /**
     * These are Onshape-specific enum strings that describe the state
     * of "Workflow" objects (i.e., one of the resources in the Onshape REST API).
     * 
     * These will help us detect when our release package has successfully completed, well, releasing!
     */
    ONSHAPE_RELEASE_OBJECT_TYPE: "RELEASE",
    ONSHAPE_RELEASE_STATE_COMPLETED: "RELEASED",

    /** 
     * On the UI, we will use this string to include an option for users
     * to export their derivative files to Google Drive. It is 
     * placed in this file to help our backend stays in sync with the front-end.
     */
    GOOGLE_DRIVE_EXPORT_DESTINATION: "googleDrive"
}
