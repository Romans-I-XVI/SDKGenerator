var path = require("path");

// Making resharper less noisy - These are defined in Generate.js
if (typeof (getCompiledTemplate) === "undefined") getCompiledTemplate = function () { };
if (typeof (templatizeTree) === "undefined") templatizeTree = function () { };

// generate.js looks for some specific exported functions (as defined in TOC.json) in make.js, like:
exports.makeClientAPI2 = function (apis, sourceDir, apiOutputDir) {
    // Builds the client api.  The provided "api" variable is a single object, the API_SPECS/client.api.json as an object
    
    console.log("Generating Client api from: " + sourceDir + " to: " + apiOutputDir);
    templatizeTree({}, path.resolve(sourceDir, "source"), apiOutputDir); // Copy the whole source directory as-is
    for (var i = 0; i < apis.length; i++) {
        makeApi(apis[i], sourceDir, apiOutputDir);
    }
}

// // generate.js looks for some specific exported functions (as defined in TOC.json) in make.js, like:
// exports.makeServerAPI = function (apis, sourceDir, apiOutputDir) {
//     // Builds the server api.  The provided "apis" variable is a list of objects, Examples: API_SPECS/Legacy/PlayFab/admin.api.json and API_SPECS/Legacy/PlayFab/server.api.json
//     // If you don't want admin, you should filter it out yourself (for now)
    
//     console.log("Generating Server api from: " + sourceDir + " to: " + apiOutputDir);
//     templatizeTree({}, path.resolve(sourceDir, "source"), apiOutputDir); // Copy the whole source directory as-is
//     MakeExampleTemplateFile(sourceDir, apiOutputDir);
// }

// // generate.js looks for some specific exported functions (as defined in TOC.json) in make.js, like:
// exports.makeCombinedAPI = function (apis, sourceDir, apiOutputDir) {
//     // Builds every api.  The provided "apis" variable is a list of objects, Examples: API_SPECS/Legacy/PlayFab/admin.api.json, API_SPECS/Legacy/PlayFab/server.api.json, and API_SPECS/Legacy/PlayFab/client.api.json
    
//     console.log("Generating Combined api from: " + sourceDir + " to: " + apiOutputDir);
//     templatizeTree({}, path.resolve(sourceDir, "source"), apiOutputDir); // Copy the whole source directory as-is
//     MakeExampleTemplateFile(sourceDir, apiOutputDir);
// }

function makeApi(api, sourceDir, apiOutputDir) {
    var locals = {
        api: api,
        sdkVersion: sdkGlobals.sdkVersion,
        sourceDir: sourceDir,
    };

    var apiTemplate = getCompiledTemplate(path.resolve(sourceDir, "templates/exampleTemplate.txt.ejs"));
    writeFile(path.resolve(apiOutputDir, "PlayFab" + api.name + "Api.brs"), apiTemplate(locals));
}
