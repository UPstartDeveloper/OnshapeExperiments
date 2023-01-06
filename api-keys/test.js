// Test setup

require('dotenv').config();
const server = require('./server.js');
const supertest = require('supertest');
const requestWithSupertest = supertest(server);

/** Test Suite */

describe('Home Page', () => {

    it('GET / should show home page', async () => {
      const res = await requestWithSupertest.get('/');
        expect(res.status).toEqual(200);
        expect(res.type).toEqual(expect.stringContaining('html'));
    });
  
  });

describe('Viewer', () => {

    it('GET /truck-viewer should display the Three.js canvas', async () => {
        const res = await requestWithSupertest.get('/truck-viewer');
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('html'));
    });

});

describe('Onshape Part Studio glTF Export API', () => {

    it('GET /api/get-gltf/:did/:wvm/:wvmid/:eid should return a serialized glTF', async () => {
        // test request parameters - should work, b/c I set this doc to be public: https://cad.onshape.com/documents/f246b429ad653513d90defe2/w/467dd42ecaa46be04cc2500a/e/eff42e24b584233240dff36f?renderMode=0&uiState=63ab48804712bc5b1475f699
        const did = "f246b429ad653513d90defe2",
          wvm = "w",
          wvmid = "467dd42ecaa46be04cc2500a",
          eid = "eff42e24b584233240dff36f";

        const res = await requestWithSupertest.get(`/api/get-gltf/${did}/${wvm}/${wvmid}/${eid}`);
          expect(res.status).toEqual(200);
          expect(res.type).toEqual(expect.stringContaining('json'));
    });

});