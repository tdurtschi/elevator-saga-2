import Swal from "sweetalert2";
import {CreateMLCEngine} from "@mlc-ai/web-llm";
import {allModels} from "./models.js";
import {getAiSettings, patchAiSettings} from "./persistence.js";
import {log} from "./terminal-logger.js";

// Alternate list of 'recommended' otherModels:
var recommendedModels = [
    "Hermes-3-Llama-3.2-3B-q4f16_1-MLC",
    "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    "Phi-3.5-mini-instruct-q4f32_1-MLC",
    "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC"
];

const otherModels = allModels.map(m => m.model_id).filter(m => recommendedModels.findIndex(rm => rm === m) === -1).sort();

let client;

export const defaultPrompt =
    "When the elevator is idle, it should go to floor 0, then floor 1, and repeat.\n";

export const fetchNewSettingsFromUser = async () => {
    let settings = getAiSettings();
    console.log("current", settings);

    let renderOption = model => `<br><label><input type='radio' name='rate' value='` + model + `' ${settings?.modelName === model ? " checked" : ""}>${model}</label>`;
    const result = await Swal.fire({
        title: "AI Settings",
        theme: "dark",
        html: `
                <p>AI prompts require a browser compable with <a href="https://webllm.mlc.ai/">WebLLM</a>.</p>
                <span>Recommended models:</span>
                <div id="recommended-model-options">
                ${recommendedModels.map(renderOption).join('')}
                </div> 
                <span>Other models:</span>
                <div id="other-model-options">
                ${otherModels.map(renderOption).join('')}
                </div>
            `,
        focusConfirm: false,
        showCancelButton: settings != null,
        preConfirm: () => {
            console.log(document.querySelector('input[name="rate"]:checked').value.trim());

            return document.querySelector('input[name="rate"]:checked').value.trim();
        },
    });

    if (result.isDismissed) {
        return settings;
    }

    const modelName = result.value;
    settings = {modelName};

    return settings;
};

const getSettings = async () => {
    let settings = getAiSettings();
    if (settings == null) {
        settings = await updateSettings()
    }
    return settings;
}

export const updateSettings = async () => {
    var settings = await fetchNewSettingsFromUser();
    patchAiSettings(settings);
    return settings;
}

const createClient = async (settings) => {
    const initProgressCallback = (progress) => {
        log(progress.text + "...");
        console.log("Model loading progress:", progress);
    };
    const engine = await CreateMLCEngine(settings.modelName, {initProgressCallback});
    engine.modelName = settings.modelName;
    return engine;
};

const systemPrompt = new Promise((resolve, reject) => {
    fetch("elevator-saga-prompt.md")
        .then(function (resp) {
            if (!resp.ok)
                throw new Error(
                    "Failed to fetch elevator-saga-prompt.md: " + resp.status
                );
            return resp.text();
        })
        .then(function (text) {
            resolve(text);
        })
        .catch(function (err) {
            reject(err);
        });
});

export function getInstructions() {
    let {instructions} = getSettings() || {};

    if (instructions) {
        return Promise.resolve(instructions);
    }
    return systemPrompt;
}

export function resetInstructions() {
    return systemPrompt.then(sp => {
        patchAiSettings({instructions: sp})
        return sp;
    });
}

export function setInstructions(newInstructions) {
    patchAiSettings({instructions: newInstructions});
}

const sanitizeResponse = (response) => {
    const functionIndex = response.indexOf("function");
    const endIndex = response.lastIndexOf("}") + 1;
    if (functionIndex !== -1 && endIndex !== -1 && endIndex > functionIndex) {
        return response.substring(functionIndex, endIndex);
    }
    return response;
};

export async function sendMessage(query) {
    // Only send if there's a message
    if (!query.trim()) return;

    const settings = await getSettings();
    if (!client || client.modelName !== settings.modelName) {
        client = await createClient(settings);
    }

    return getInstructions()
        .then((sp) =>
            client.completions.create({
                seed: 1,
                messages: [
                    {
                        role: "system",
                        content: sp
                    },
                    {
                        role: "user",
                        content: query,
                    },
                ],
            })
        )
        .then((response) => {
            console.log(response);
            return response.choices[0]?.text ?? ""
        })
        .then(sanitizeResponse);
}
