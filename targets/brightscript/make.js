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
        getAuthParams: getAuthParams,
        getRequestActions: getRequestActions,
        getResultActions: getResultActions,
        getDeprecationAttribute: getDeprecationAttribute,
        generateApiSummary: generateApiSummary,
    };

    var apiTemplate = getCompiledTemplate(path.resolve(sourceDir, "templates/API.brs.ejs"));
    writeFile(path.resolve(apiOutputDir, "PlayFab" + api.name + "Api.brs"), apiTemplate(locals));
}

function getAuthParams(apiCall) {
    if (apiCall.url === "/Authentication/GetEntityToken")
        return "authKey, authValue";
    if (apiCall.auth === "EntityToken")
        return "\"X-EntityToken\", PlayFab()._internalSettings.EntityToken";
    if (apiCall.auth === "SecretKey")
        return "\"X-SecretKey\", PlayFab().Settings.DeveloperSecretKey";
    else if (apiCall.auth === "SessionTicket")
        return "\"X-Authorization\", PlayFab()._internalSettings.SessionTicket";
    return "invalid, invalid";
}

function getDeprecationAttribute(tabbing, apiObj) {
    var isDeprecated = apiObj.hasOwnProperty("deprecation");

    if (isDeprecated && apiObj.deprecation.ReplacedBy != null)
        return tabbing + "/**\n"
            + tabbing + " * @deprecated Please use " + apiObj.deprecation.ReplacedBy + " instead. \n"
            + tabbing + " */\n";
    if (isDeprecated)
        return tabbing + "/**\n"
            + tabbing + " * @deprecated Do not use\n"
            + tabbing + " */\n";
    return "";
}

function generateApiSummary(tabbing, apiElement, summaryParam, extraLines) {
    var lines = generateApiSummaryLines(apiElement, summaryParam, extraLines);

    var output = "";
    if (lines.length > 0) {
        for (let i = 0; i < lines.length; i++) {
            const element = lines[i];
            output += tabbing + "' " + lines[i] + "\n";
        }
    }
    return output;
}

function getRequestActions(tabbing, apiCall) {
    // if (apiCall.url === "/Authentication/GetEntityToken")
    //     return tabbing + "var authKey = null; var authValue = null;\n"
    //         + tabbing + "if (!authKey && PlayFab._internalSettings.sessionTicket) { var authInfo = PlayFab._internalSettings.GetAuthInfo(request, authKey=\"X-Authorization\"); authKey = authInfo.authKey, authValue = authInfo.authValue; }\n"
    //         + tabbing + "if (!authKey && PlayFab.settings.developerSecretKey) { var authInfo = PlayFab._internalSettings.GetAuthInfo(request, authKey=\"X-SecretKey\"); authKey = authInfo.authKey, authValue = authInfo.authValue; }\n";
    // if (apiCall.result === "LoginResult" || apiCall.request === "RegisterPlayFabUserRequest")
    //     return tabbing + "request.TitleId = PlayFab.settings.titleId ? PlayFab.settings.titleId : request.TitleId; if (!request.TitleId) throw PlayFab._internalSettings.errorTitleId;\n"
    //         + tabbing + "// PlayFab._internalSettings.authenticationContext can be modified by other asynchronous login attempts\n"
    //         + tabbing + "// Deep-copy the authenticationContext here to safely update it\n"
    //         + tabbing + "var authenticationContext = JSON.parse(JSON.stringify(PlayFab._internalSettings.authenticationContext));\n";
    return "";
}

function getResultActions(tabbing, apiCall) {
    if (apiCall.result === "LoginResult")
        return "\n\n"
            + tabbing + "result = ParseJson(post.Result)\n"
            + tabbing + "if result <> invalid\n"
            + tabbing + "    if result.data.PlayFabID <> invalid\n"
            + tabbing + "        PlayFab()._internalSettings.PlayFabID = result.data.PlayFabID\n"
            + tabbing + "    end if\n"

            + tabbing + "    if result.data.SessionTicket <> invalid\n"
            + tabbing + "        PlayFab()._internalSettings.SessionTicket = result.data.SessionTicket\n"
            + tabbing + "    end if\n"

            + tabbing + "    if result.data.EntityToken <> invalid\n"
            + tabbing + "        PlayFab()._internalSettings.EntityId = result.data.EntityToken.Entity.Id\n"
            + tabbing + "        PlayFab()._internalSettings.EntityType = result.data.EntityToken.Entity.Type\n"
            + tabbing + "        PlayFab()._internalSettings.EntityToken = result.data.EntityToken.EntityToken\n"
            + tabbing + "    end if\n"
            + tabbing + "end if\n"
    // if (apiCall.result === "RegisterPlayFabUserResult")
    //     return tabbing + "if (result != null && result.data.SessionTicket != null) {\n"
    //         + tabbing + "    PlayFab._internalSettings.sessionTicket = result.data.SessionTicket;\n"
    //         + tabbing + "    PlayFab.ClientApi._MultiStepClientLogin(result.data.SettingsForUser.NeedsAttribution);\n"
    //         + tabbing + "}";
    // if (apiCall.url === "/Authentication/GetEntityToken")
    //     return tabbing + "if (result != null && result.data.EntityToken != null)\n"
    //         + tabbing + "    PlayFab._internalSettings.entityToken = result.data.EntityToken;";
    // if (apiCall.url === "/Client/AttributeInstall")
    //     return tabbing + "// Modify advertisingIdType:  Prevents us from sending the id multiple times, and allows automated tests to determine id was sent successfully\n"
    //         + tabbing + "PlayFab.settings.advertisingIdType += \"_Successful\";\n";
    return "";
}
