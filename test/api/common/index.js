import {readFileSync, readdirSync} from 'fs';
import * as rp from 'request-promise';
import * as request from 'request'; 
import * as assert from 'assert';
import * as Ajv from 'ajv';
import * as path from 'path';
import * as _ from 'lodash';

const schemaDirName = path.join(__dirname, '../schemas');

const ajv = new Ajv({
    // check all rules collecting all errors instead of returning after the first error.
    allErrors: true,
    // if the reference cannot be resolved during compilation the exception is thrown
    missingRefs: true
});

// Add all schemas
readdirSync(schemaDirName).forEach((fileName) => {
    // Note: this method does not compile schemas so that deps can be added in any order
    ajv.addSchema(require('../schemas/' + fileName), fileName);
});

const baseUrl = 'http://localhost:3000';

const jar = request.jar(); // shared cookie jar

/**
 * Request based on requestFile
 * 
 * 1. Load requestFile from test/api/requests
 * 2. Append server baseUrl to $request.uri
 * 3. Set $request.json to true 
 * 4. Call request-promise
 */
export function req(requestFile, opt) {
    let requestObject = require('../requests' + requestFile);
    requestObject = _.clone(requestObject);
    requestObject.uri = baseUrl + requestObject.uri;
    console.log(`${requestObject.method}: ${requestObject.uri}`);
    requestObject.json = true;
    if (opt && opt.jar) {
        requestObject.jar = opt.jar;
    } else {
        requestObject.jar = jar;

    }

    return rp(requestObject);
}

/**
 * Test requestFile
 * 
 * 1. Load requestFile from test/api/requests
 * 2. Append server baseUrl to $request.uri
 * 3. Set $request.json to true 
 * 4. Call request-promise
 * 5. Assert $response.code === 200
 * 6. Validate $response.result based on target schema
 */
export function test(requestFile, opt) {
    return req(requestFile, opt).then((res) => {
        assert.strictEqual(res.code, 200);
        const requestObject = require('../requests' + requestFile);
        if (!requestObject.schema) {
            return;
        }
        const valid = ajv.validate(requestObject.schema, res.result);
        if (!valid) {            
            console.log(JSON.stringify(res, null, 4));
            throw ajv.errorsText();
        }
    });
}