const WebhookService = require('./services/webhook-service');
const { 
    onshapeExportToGoogleDriveFlow,
    webhookCallbackRootUrl 
} = require('./config');
const { 
    forwardRequestToFlow,
    ONSHAPE_WORKFLOW_EVENT,
    ONSHAPE_RELEASE_OBJECT_TYPE,
    ONSHAPE_RELEASE_STATE_COMPLETED
} = require('./utils');
const razaClient = require('./raza-client');
    
const apiRouter = require('express').Router();

/**
 * Get the email of the current user (amongst other profile info) from Onshape.
 * 
 * GET /api/users/sessioninfo
 *      -> 200, [ ...email ]
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/email', (req, res) => {
    forwardRequestToFlow({
        httpVerb: "GET",
        requestUrlParameters: "users/sessioninfo",
        res: res
    });
});

/**
 * Register webhook notification of the latest completed release package.
 * 
 * GET /api/notifications?documentId=...&workspaceId=...&companyId=...
 *      -> 200, { ..., id: '...' }
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/notifications', async (req, res) => {
    // Extract the necessary IDs from the querystring
    const cid = req.query.companyId, 
          exportDestination = req.query.exportDestination ? req.query.emailAddress: "",
          emailAddress = req.query.emailAddress ? req.query.emailAddress: "",
          emailMessage = req.query.emailMessage ? req.query.emailMessage: "";

    const webhookParams = {
        companyId: cid,
        webhookCallbackRootUrl: webhookCallbackRootUrl
    };

    // save the query string data - will come in useful later
    Object.defineProperty(razaClient, "exportDestination", {
        value: exportDestination,
        writable: true
    });
    Object.defineProperty(razaClient, "emailAddress", {
        value: emailAddress,
        writable: true
    });
    Object.defineProperty(razaClient, "emailMessage", {
        value: emailMessage,
        writable: true
    });

    WebhookService.registerWebhook(webhookParams, res)
        // provide the client with the webhook ID, so they know it was register
        .then((webhookId) => res.status(200).send({ webhookID: webhookId }))
        .catch((err) => {
            console.error(`Failed to register webhook: ${err}`);
            res.status(500).json({ error: err });
        }
    );
});

/**
 * TODO[5][Zain]: IGNORE THIS ROUTE FOR NOW
 *                confirm with Gideon - how many different systems could a customer
 *                wish to send their rel pkg to? 
 *                And, what is the use case around if they decide to move out of Google Drive, if any?
 *                      --> reason I ask is because I'm not sure if we need to support a "delete webhook btn"?
 * Retrieve the release package in JSON.
 * 
 * GET /api/gltf/:tid
 *      -> 200, { ...gltf_data }
 *      -or-
 *      -> 500, { error: '...' }
 *      -or-
 *      -> 404 (which may mean that the translation is still being processed)
 */
apiRouter.get('/gltf/:tid', async (req, res) => {
    const results = razaClient[req.params.tid];
    console.log("found translation!", JSON.stringify(results));
    // not a valid ID
    if (results === null || results === undefined) {
        // No record in Redis => not a valid ID (or wasn't saved correctly)
        res.status(404).end();
    } else {
        if ('in-progress' === results) {
            // Valid ID, but results are not ready yet.
            res.status(202).end();
        } else {
            // GLTF data is ready.
            const reqUrl = `translations/${req.params.tid}`;
            const transResp = await forwardRequestToFlow({
                httpVerb: "GET",
                requestUrlParameters: reqUrl,
                // res: res
            });
            const transJson = await transResp.json();
            if (transJson.requestState === 'FAILED') {
                res.status(500).json({ error: transJson.failureReason });
            } else {
                forwardRequestToFlow({
                    httpVerb: "GET",
                    requestUrlParameters: [
                        // `${onshapeApiUrl}`,  // will be injected in Flow itself
                        "documents",
                        "d",
                        `${transJson.documentId}`,
                        "externaldata",
                        `${transJson.resultExternalDataIds[0]}`, 
                    ].join("/"),
                    res: res
                });
            }
            const webhookID = results;
            WebhookService.unregisterWebhook(webhookID)
                .then(() => console.log(`Webhook ${webhookID} unregistered successfully`))
                .catch((err) => console.error(`Failed to unregister webhook ${webhookID}: ${JSON.stringify(err)}`));
            // delete the key-value pair in our "store" - [Zain]
            delete razaClient[req.params.tid];
            console.log("just tried to delete translation, store updated: ", JSON.stringify(razaClient));
        }
    }
});

/**
 * Receive a webhook event.
 * 
 * POST /api/event
 *      -> 200
 */
apiRouter.post('/event', async (req, res) => {
    console.log(`I received a webhook notification! Here: ${JSON.stringify(req.body)}`);
    const eventJson = req.body;
    if (eventJson.event === ONSHAPE_WORKFLOW_EVENT) {
        /**
         * Save in memory so we can return to client later (& unregister the webhook).
         * TODO[Zain][4] - use a better memory store - e.g., see these links to do using cookies:
         *      --> https://stackoverflow.com/questions/34674326/node-express-storage-and-retrieval-of-authentication-tokens
         *      --> https://stackoverflow.com/questions/16209145/how-can-i-set-cookie-in-node-js-using-express-framework
         */
        if (eventJson.objectType === ONSHAPE_RELEASE_OBJECT_TYPE) {
            const rpId = eventJson.objectId;
            // check if this release is all done, if so forward to flow
            const releasePackage = await forwardRequestToFlow({
                httpVerb: "GET",
                requestUrlParameters: `releasepackages/${rpId}`,
                res: res
            });
            if (releasePackage.stateId === ONSHAPE_RELEASE_STATE_COMPLETED) {
                // post all the needed params to the GDrive Flow
                const exportFlowParams = {
                    exportDestination: razaClient["exportDestination"],
                    email: razaClient["emailAddress"],
                    emailMessage: razaClient["emailMessage"]
                };
                console.log(`Found these export options: ${JSON.stringify(exportFlowParams)}`);
                fetch(onshapeExportToGoogleDriveFlow, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(exportFlowParams)
                });
            }
        }
    }
    // TODO[Zain]: use one the logs below to add to: https://onshape-public.github.io/docs/webhook/
    console.log(`Workflow transition example: ${JSON.stringify(req.body)}`);
    res.status(200).send();
});

module.exports = apiRouter;