function emitAction(name, data) {
    console.log({
        action: name,
        date: Date.now(),
        data: data
    })
}

var modulesToFiles = {
    'WebInspector.ElementsPanel': 'ElementsPanel.js'
};

var _callbacks = {};

(function monkeypatchImportScript() {
    var originalImportScript = window.importScript;

    /**
     * @param {string} scriptName
     */
    window.importScript = function(scriptName) {
        if (_importedScripts[scriptName]) {
            return;
        }

        originalImportScript.apply(this, arguments);

        if (_callbacks[scriptName]) {
            _callbacks[scriptName].forEach(function(callback) {
                callback();
            })
        }
    }
})();


function onScriptLoad(path, callback) {
    if (isDefined(path)) {
        callback();
    } else {
        var scriptName = modulesToFiles[path];
        if (_importedScripts[scriptName]) {
            callback();
        } else {
            if (!_callbacks[scriptName]) {
                _callbacks[scriptName] = [];
            }

            _callbacks[scriptName].push(callback);
        }
    }
}


/**
 * @param {string} path such as 'WebInspector.ElementsPanel.prototype._setPseudoClassForNodeId'
 * @return {boolean}
 */
function isDefined(path) {
    var obj = window;
    var keys = path.split('.');
    var key = '';
    while (key = keys.shift()) {
        if (obj.hasOwnProperty(key)) {
            obj = obj[key];
        } else {
            return false;
        }
    }
    return true;
}


// check element for forced element state
onScriptLoad('WebInspector.ElementsPanel', function() {

    var originalMethod = WebInspector.ElementsPanel.prototype._setPseudoClassForNodeId;

    WebInspector.ElementsPanel.prototype._setPseudoClassForNodeId = function(nodeId, pseudoClass, enable) {
        originalMethod.apply(this, arguments);

        if (!enable)
            return;

        var node = WebInspector.domAgent.nodeForId(nodeId);
        if (!node)
            return;

        var id = node.getAttribute("id");
        emitAction("forcedElementState", {
            id: id,
            state: pseudoClass
        });
    }
});