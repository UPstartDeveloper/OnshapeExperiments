const fetch = require('node-fetch');
const { forwardRequestToFlow } = require('../utils');
const {
    accessKey,
    onshapeRegisterWebhookFlow,
    secretKey
} = require('../config');

module.exports = {
    
    /**
     * Register a new webhook to listen for completion of release packages.
     * @param {Object<string, string>} webhookParams: provides the identifiers needed to trigger the webhook
     *      @param {string} companyId The ID of the company we (the admin user) are in
     *      @param {string} webhookCallbackRootUrl the URL of our app (for Onshape to POST back to, when the webhook fires)
     * 
     * @returns {Promise<string,string>} Resolves with the webhook ID, or rejects with error message.
     */
    registerWebhook: (webhookParams, res) => {
        return new Promise(async (resolve, reject) => {
            try {
                // add the string we'll need for authorizating the request made to Onshape
                const encodedString = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
                webhookParams.basicAuthSignature = encodedString;
                // fwd request to Flow!
                const resp = await fetch(onshapeRegisterWebhookFlow, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(webhookParams)
                });
                const respJson = await resp.json();
                if (resp.ok) {
                    resolve(respJson.id);
                } else {
                    reject('Failed to create webhook ' + JSON.stringify(respJson));
                }
            } catch (err) {
                reject(err);
            }
        });
    },
    
    /**
     * Unregister the given webhook.
     * @param {string} webhookID The ID of the webhook to unregister.
     * @param {Response} res The response to be proxied from the Onshape API.
     * @returns {Promise<Response,string>} resolves with the response, or rejects with error text.
     */
    unregisterWebhook: webhookID => {
        return new Promise(async (resolve, reject) => {
            const resp = await forwardRequestToFlow({
                httpVerb: "DELETE",
                requestUrlParameters: `webhooks/${webhookID}`,
                // res: res
            });
            if (resp.ok) {
                resolve(resp);
            } else {
                reject(await resp.text());
            }
        });
    }
};
