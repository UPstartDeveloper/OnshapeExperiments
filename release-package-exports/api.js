const WebhookService = require('./services/webhook-service');
const { webhookCallbackRootUrl } = require('./config');
const { forwardRequestToFlow } = require('./utils');
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
 * TODO[Zain][4]
 * Register webhook notification of the latest completed release package.
 * 
 * GET /api/gltf?documentId=...&workspaceId=...&gltfElementId=...
 *      -> 200, { ..., id: '...' }
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/gltf', async (req, res) => {
    // Extract the necessary IDs from the querystring
    const cid = req.query.companyId;

    const webhookParams = {
        companyId: cid,
        webhookCallbackRootUrl: webhookCallbackRootUrl
    };

    WebhookService.registerWebhook(webhookParams, res)
        .catch((err) => console.error(`Failed to register webhook: ${err}`));
    
    const translationParams = {
        documentId: did,
        workspaceId: wid,
        resolution: 'medium',
        distanceTolerance: 0.00012,
        angularTolerance: 0.1090830782496456,
        maximumChordLength: 10
    };
    try {
        const resp = await (partId ? TranslationService.translatePart(gltfElemId, partId, translationParams, res)
            : TranslationService.translateElement(gltfElemId, translationParams, res));
        // Store the tid in memory so we know that it's being processed; it will remain 'in-progress' until we
        // are notified that it is complete, at which point it will be the translation ID.
        if (resp.contentType.indexOf('json') >= 0) {
            Object.defineProperty(razaClient, JSON.parse(resp.data).id, {
                value: 'in-progress',
                writable: true
            });
            console.log("just tried to store tid, updated: ", JSON.stringify(razaClient));
        }
        res.status(200).contentType(resp.contentType).send(resp.data);
    } catch (err) {
        // error message should also be sent in server res --> see forwardRequestToFlow()
        console.log(`Error requesting translation from Onshape: ${err}`);
    }
});

/**
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
apiRouter.post('/event', (req, res) => {
    if (req.body.event === 'onshape.model.translation.complete') {
        // Save in Redis so we can return to client later (& unregister the webhook).
        // redisClient.set(req.body.translationId, req.body.webhookId);  // [Zain] - old stuff
        Object.defineProperty(razaClient, req.body.translationId, {
            value: req.body.webhookId,
            writable: true   //  until we have the webhook id, it's "in-progress"
          });
        console.log("just tried to receive webhook event, store updated: ", JSON.stringify(razaClient));
    }
    res.status(200).send();
});

module.exports = apiRouter;