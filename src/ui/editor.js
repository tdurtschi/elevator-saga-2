import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import $ from "jquery";
import _ from "lodash-es";
import {getCodeObjFromCode} from "../libs/util.js";
import {typeDeclarations} from "./types.js";
import {getBackupCode, setBackupCode, getCode, setCode} from "./persistence.js";
import { observable } from "../libs/unobservable.js";
import { confirmAction } from "./dialogs.js";

window.monaco = monaco;

window.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'typescript' || label === 'javascript') return new tsWorker();
        return new editorWorker();
    }
};

let editor = null;
let codeModel = null;

export const createEditorAsync = () => new Promise((resolve) => {
    if (!editor) {
        codeModel = monaco.editor.createModel("// code goes here\n", "javascript", "inmemory://model/code");

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        editor = monaco.editor.create(document.getElementById("editor"), {
            theme: isDark ? 'vs-dark' : 'vs',
            folding: false,
            minimap: {enabled: false},
            wordWrap: "on",
            language: "javascript",
            model: codeModel,
        });
    }

    // Add type declarations
    monaco.languages.typescript.javascriptDefaults.addExtraLib(typeDeclarations);

    var reset = function () {
        codeModel.setValue($("#default-elev-implementation").text().trim());
    };
    var saveCode = function () {
        setCode(codeModel.getValue());
        $("#save_message").text("Code saved " + new Date().toTimeString());
        editorService.trigger("change");
    };

    var existingCode = getCode();
    if (existingCode) {
        codeModel.setValue(existingCode);
    } else {
        reset();
    }

    $("#button_save").click(function () {
        saveCode();
        editor.focus();
    });

    $("#button_reset").click(async function () {
        if (await confirmAction("Do you really want to reset to the default implementation? This will erase your changes to the code.")) {
            setBackupCode(editor.getValue());
            reset();
        }
        editor.focus();
    });

    $("#button_resetundo").click(async function () {
        if (await confirmAction("Do you want to bring back the code as before the last reset?")) {
            codeModel.setValue(getBackupCode() || "");
        }
        editor.focus();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveCode);
    editor.addAction({
        id: 'apply-code',
        label: 'Apply Code',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: function () {
            saveCode();
            editorService.trigger("apply_code");
        }
    });

    new ResizeObserver(() => editor.layout()).observe(document.getElementById("editor"));

    var editorService = observable({});
    var autoSaver = _.debounce(saveCode, 1000);
    editor.onDidChangeModelContent(autoSaver);

    editorService.getCodeObj = async function () {
        console.log("Getting code...");
        var code = editor.getValue();
        var obj;
        try {
            obj = await getCodeObjFromCode(code);
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

    resolve(editorService);
});
