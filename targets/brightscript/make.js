var path = require("path");

// Making resharper less noisy - These are defined in Generate.js
if (typeof (templatizeTree) === "undefined") templatizeTree = function () { };
if (typeof (generateApiSummaryLines) === "undefined") generateApiSummaryLines = function () { };
if (typeof (getCompiledTemplate) === "undefined") getCompiledTemplate = function () { };

exports.makeClientAPI2 = function (apis, sourceDir, apiOutputDir) {
    // Builds the client api.  The provided "api" variable is a single object, the API_SPECS/client.api.json as an object

    console.log("Generating Client api from: " + sourceDir + " to: " + apiOutputDir);
    makePlayFab(apis, sourceDir,apiOutputDir)
    for (var i = 0; i < apis.length; i++) {
        makeApi(apis[i], sourceDir, apiOutputDir);
    }
}

function makePlayFab(apis, sourceDir, apiOutputDir) {
    var locals = {
        apis: apis,
        sdkVersion: sdkGlobals.sdkVersion
    };

    var apiTemplate = getCompiledTemplate(path.resolve(sourceDir, "templates/PlayFab.brs.ejs"));
    writeFile(path.resolve(apiOutputDir, "PlayFabSDK/PlayFab.brs"), apiTemplate(locals));
}

function makeApi(api, sourceDir, apiOutputDir) {
    var locals = {
        api: api,
        getAuthParams: getAuthParams,
        getRequestActions: getRequestActions,
        getResultActions: getResultActions,
        getDeprecationAttribute: getDeprecationAttribute,
        generateApiSummary: generateApiSummary,
    };

    var apiTemplate = getCompiledTemplate(path.resolve(sourceDir, "templates/API.brs.ejs"));
    writeFile(path.resolve(apiOutputDir, "PlayFabSDK/PlayFab" + api.name + "SDK.brs"), apiTemplate(locals));
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
        return tabbing + "' !!! Deprecated !!! - Please use " + apiObj.deprecation.ReplacedBy + " instead.\n    ";
    if (isDeprecated)
        return tabbing + "' !!! Deprecated !!! - Do not use\n    ";
    return "";
}

function generateApiSummary(tabbing, apiElement, summaryParam, extraLines) {
    var lines = generateApiSummaryLines(apiElement, summaryParam, extraLines);

    var output = "";
    if (lines.length > 0) {
        for (let i = 0; i < lines.length; i++) {
            output += tabbing + "' " + lines[i] + "\n";
        }
    }
    return output;
}

function getRequestActions(tabbing, apiCall) {
    if (apiCall.url === "/Authentication/GetEntityToken")
        return  "\n"
            + tabbing + "authKey = invalid\n"
            + tabbing + "authValue = invalid\n"
            + tabbing + "if PlayFab()._internalSettings.EntityToken <> invalid\n"
            + tabbing + "    authKey = \"X-EntityToken\"\n"
            + tabbing + "    authValue = PlayFab()._internalSettings.EntityToken\n"
            + tabbing + "else if PlayFab()._internalSettings.SessionTicket <> invalid\n"
            + tabbing + "    authKey = \"X-Authorization\"\n"
            + tabbing + "    authValue = PlayFab()._internalSettings.SessionTicket \n"
            + tabbing + "else if PlayFab().Settings.DeveloperSecretKey <> invalid\n"
            + tabbing + "    authKey = \"X-SecretKey\"\n"
            + tabbing + "    authValue = PlayFab().Settings.DeveloperSecretKey\n"
            + tabbing + "end if\n"
    if (apiCall.result === "LoginResult" || apiCall.request === "RegisterPlayFabUserRequest")
        return "\n"
            + tabbing + "if PlayFab().Settings.TitleID <> invalid\n"
            + tabbing + "    request.TitleID = PlayFab().Settings.TitleID\n"
            + tabbing + "end if\n"
            + tabbing + "if request.TitleID = invalid\n"
            + tabbing + "    print \"::PlayFab:: Error - \" +  PlayFab()._internalSettings.ErrorTitleID\n"
            + tabbing + "    stop\n"
            + tabbing + "end if\n"
    return "";
}

function getResultActions(tabbing, apiCall) {
    if (apiCall.result === "LoginResult")
        return "\n\n"
            + tabbing + "if post.IsAsync and post.SentSuccessfully\n"
            + tabbing + "    PlayFab().Wait(post)\n"
            + tabbing + "end if\n"
            + tabbing + "if post.Result <> invalid\n"
            + tabbing + "    result = ParseJson(post.Result)\n"
            + tabbing + "    if result.data = invalid\n"
            + tabbing + "        result.data = {}\n"
            + tabbing + "    end if\n"
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
    if (apiCall.url === "/Authentication/GetEntityToken")
        return "\n\n"
            + tabbing + "if post.IsAsync and post.SentSuccessfully\n"
            + tabbing + "    PlayFab().Wait(post)\n"
            + tabbing + "end if\n"
            + tabbing + "if post.Result <> invalid\n"
            + tabbing + "    result = ParseJson(post.Result)\n"
            + tabbing + "    if result.data = invalid\n"
            + tabbing + "        result.data = {}\n"
            + tabbing + "    end if\n"
            + tabbing + "    if result.data.EntityToken <> invalid\n"
            + tabbing + "        PlayFab()._internalSettings.EntityToken = result.data.EntityToken\n"
            + tabbing + "    end if\n"
            + tabbing + "end if\n"
    if (apiCall.result === "RegisterPlayFabUserResult")
        return "\n\n"
            + tabbing + "if post.IsAsync and post.SentSuccessfully\n"
            + tabbing + "    PlayFab().Wait(post)\n"
            + tabbing + "end if\n"
            + tabbing + "if post.Result <> invalid\n"
            + tabbing + "    result = ParseJson(post.Result)\n"
            + tabbing + "    if result.data = invalid\n"
            + tabbing + "        result.data = {}\n"
            + tabbing + "    end if\n"
            + tabbing + "    if result.data.SessionTicket <> invalid\n"
            + tabbing + "        PlayFab()._internalSettings.SessionTicket = result.data.SessionTicket\n"
            + tabbing + "    end if\n"
            + tabbing + "end if\n"

    return "";
}
