import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import $ from "jquery";
import _ from "lodash-es";
import {getCodeObjFromCode} from "../libs/util.js";
import {typeDeclarations} from "./types.js";
import {defaultPrompt, sendMessage, updateSettings, getInstructions, resetInstructions, setInstructions} from "../ai/ai.js";
import {getBackupCode, getPrompt, setBackupCode, getCode, setCode, setPrompt, getAiSettings, patchAiSettings} from "./persistence.js";
import { observable } from "../libs/unobservable.js";

window.monaco = monaco;

window.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'typescript' || label === 'javascript') return new tsWorker();
        return new editorWorker();
    }
};

let editor = null;
let codeModel, promptModel, instructionsModel = null;

export const createEditorAsync = () => new Promise((resolve) => {
    if (!editor) {
        codeModel = monaco.editor.createModel("// code goes here\n", "javascript", "inmemory://model/code");
        promptModel = monaco.editor.createModel(defaultPrompt, "text/plain", "inmemory://model/prompt");
        instructionsModel = monaco.editor.createModel("", "text/plain", "inmemory://model/instructions");

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        editor = monaco.editor.create(document.getElementById("editor"), {
            theme: isDark ? 'vs-dark' : 'vs',
            folding: false,
            minimap: {enabled: false},
            wordWrap: "on",
            language: "javascript",
            model: codeModel,
            acceptSuggestionOnEnter: 'off',
        });
    }

    // Add type declarations
    monaco.languages.typescript.javascriptDefaults.addExtraLib(typeDeclarations);

    var reset = function () {
        codeModel.setValue($("#default-elev-implementation").text().trim());
        promptModel.setValue(defaultPrompt);
        resetInstructions().then(sp => instructionsModel.setValue(sp))
    };
    var saveCode = function () {
        setCode(codeModel.getValue());
        setPrompt(promptModel.getValue());
        setInstructions(instructionsModel.getValue());
        $("#save_message").text("Code saved " + new Date().toTimeString());
        editorService.trigger("change");
    };

    var existingCode = getCode();
    var existingPrompt = getPrompt();
    if (existingCode || existingPrompt) {
        if (existingPrompt) {
            promptModel.setValue(existingPrompt);
        }
        if (existingCode) {
            codeModel.setValue(existingCode);
        }
    } else {
        reset();
    }
    var { aiEnabled } = getAiSettings() || {};
    if (aiEnabled) {
        getInstructions().then(i => instructionsModel.setValue(i))
    }

    $("#button_save").click(function () {
        saveCode();
        editor.focus();
    });

    $("#button_reset").click(function () {
        if (confirm("Do you really want to reset to the default implementation? This will erase your changes to the instructions, prompt AND code tabs!.")) {
            setBackupCode(editor.getValue());
            reset();
        }
        editor.focus();
    });

    $("#button_resetundo").click(function () {
        if (confirm("Do you want to bring back the code as before the last reset?")) {
            codeModel.setValue(getBackupCode() || "");
        }
        editor.focus();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCode);

    var editorService = observable({});
    var autoSaver = _.debounce(saveCode, 1000);
    editor.onDidChangeModelContent(autoSaver);

    editorService.getCodeObj = function () {
        console.log("Getting code...");
        var code = editor.getValue();
        var obj;
        try {
            obj = getCodeObjFromCode(code);
            editorService.trigger("code_success");
        } catch (e) {
            editorService.trigger("usercode_error", e);
            return null;
        }
        return obj;
    };
    editorService.setCode = function (code) {
        codeModel.setValue(code);
    };
    editorService.getCode = function () {
        return codeModel.getValue();
    };
    editorService.setDevTestCode = function () {
        codeModel.setValue($("#devtest-elev-implementation").text().trim());
    };

    $("#button_apply").click(function () {
        saveCode();
        editorService.trigger("apply_code");
    });

    $("#button-generate").click(function (event) {
        event.preventDefault();
        setInstructions(instructionsModel.getValue());
        const promptInput = promptModel.getValue().trim();
        if (promptInput.length === 0) {
            alert("Please enter a description for the elevator behavior.");
            return;
        }

        const oldLabel = $("#button-generate").text();
        $("#button-generate")
            .attr("disabled", true)
            .text("Loading...");
        sendMessage(promptInput).then(responseText => {
            codeModel.setValue(`({
/** @type {Solution} */
init: ${responseText.trim()},
update: function (dt, elevators, floors) {}
})`)
            editor.setModel(codeModel);
            $("#tab-code").click();
            editor.getAction('editor.action.formatDocument').run()
        }).catch((e) => {
            console.error(e);
            alert("Error from AI service: " + e.message);
        }).then(() => {
            $("#button-generate")
                .attr("disabled", false)
                .text(oldLabel);
        });
    });

    $("#tab-prompt").click(function () {
        editor.setModel(promptModel)
    });

    $("#tab-instructions").click(function () {
        editor.setModel(instructionsModel)
    });

    $("#tab-code").click(function () {
        editor.setModel(codeModel)
    });

    $("#ai-settings-config").click(async function () {
        await updateSettings();
    });

    $("#ai-toggle").click(function () {
        var { aiEnabled } = getAiSettings() || {};
        aiEnabled = !aiEnabled;
        patchAiSettings({ aiEnabled });
        document.location.reload();
    });

    var { aiEnabled: aiEnabledForUI } = getAiSettings() || {};
    if (aiEnabledForUI) {
        $("#ai-toggle").text("Disable AI");
        $("#ai-settings-config").attr("style", "display: inline; float: left;");
        $("#button-generate").attr("style", "display: inline;");
        $("#tabs-form").attr("style", "display: block;");
    }

    resolve(editorService);
});
