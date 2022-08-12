const { onshapeApiUrl } = require('./config');
const { forwardRequestToOnshape } = require('./utils');
    
const apiRouter = require('express').Router();

/**
 * Retrieve glTF for a given element in a document. 
 * 
 * GET /api/get-gltf?documentId=...&inputId=...&idChoice=...&gltfElementId=...
 *      -> 200, { ... }
 *      -or-
 *      -> some error // TODO[add detail]
 */
 apiRouter.get('/get-gltf/:did/:wvm/:wvmid/:eid', async (req, res) => {
    // Extract the necessary IDs from the querystring
    const did = req.params.did,
        wvm = req.params.wvm,
        wvmid = req.params.wvmid,
        eid = req.params.eid;
    forwardRequestToOnshape(
        `${onshapeApiUrl}/assemblies/d/${did}/${wvm}/${wvmid}/e/${eid}/gltf`,
        req, res
    );
});

/**
 * Get the Elements of the current document/workspace.
 * 
 * The Onshape endpoint that's used below is found on the docs:
 *   https://cad.onshape.com/glassworks/explorer#/Document/getElementsInDocument.
 * 
 * GET /api/elements
 *      -> 200, [ ...elements ]
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/elements', (req, res) => {
    forwardRequestToOnshape(`${onshapeApiUrl}/documents`, req, res);
});

/**
 * Get the Parts of the given Element in the current document/workspace.
 * 
 * The Onshape endpoint that's used below is found on the docs:
 *   https://cad.onshape.com/glassworks/explorer#/Part/getPartsWMVE.
 * 
 * GET /api/elements/:eid/parts
 *      -> 200, [ ...parts ]
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/elements/:eid/parts', (req, res) => {
    forwardRequestToOnshape(`${onshapeApiUrl}/parts/d/${req.query.documentId}/w/${req.query.workspaceId}/e/${req.params.eid}`, req, res);
});

/**
 * Get the Parts of the current document/workspace.
 * 
 * GET /api/parts
 *      -> 200, [ ...parts ]
 *      -or-
 *      -> 500, { error: '...' }
 */
apiRouter.get('/parts', (req, res) => {
    forwardRequestToOnshape(`${onshapeApiUrl}/parts/d/${req.query.documentId}/w/${req.query.workspaceId}`, req, res);
});

module.exports = apiRouter;
