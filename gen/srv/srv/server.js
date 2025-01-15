const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const cds = require('@sap/cds');
cds.on("bootstrap", (app) => {
    app.use(proxy());

    const cds_swagger = require('cds-swagger-ui-express')
    app.use(cds_swagger());

});
module.exports = cds.server; 