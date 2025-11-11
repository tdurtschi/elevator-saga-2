import Swal from "sweetalert2";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import $ from "jquery";
import { allModels } from "./models.js";
import { getAiSettings, patchAiSettings } from "./persistence.js";

const models = allModels.map(m => m.model_id).sort();

// Alternate list of 'recommended' models:
// [
//   "Hermes-3-Llama-3.2-3B-q4f16_1-MLC", 
//   "Llama-3.2-1B-Instruct-q4f32_1-MLC",
//   "Phi-3.5-mini-instruct-q4f32_1-MLC",
//   "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC"
// ];

let client;

export const defaultPrompt =
  "When the elevator is idle, it should go to floor 0, then floor 1, and repeat.\n";

export const fetchNewSettingsFromUser = async () => {
  let settings = getAiSettings();
  console.log("current", settings);
  
  const result = await Swal.fire({
    title: "AI Settings",
    theme: "dark",
    html: `
                <p>AI prompts require a browser compable with <a href="https://webllm.mlc.ai/">WebLLM</a>.</p>
                Model name: 
                <div id="model-options">
                ${models.map(model => "<br><label tooltip=><input type='radio' name='rate' value='" + model + "'" + (settings?.modelName === model ? " checked" : "") + "> " + model + "</label>").join('')}
                </div>
            `,
    focusConfirm: false,
    showCancelButton: settings != null,
    preConfirm: () => {
      console.log( document.querySelector('input[name="rate"]:checked').value.trim());
      
      return document.querySelector('input[name="rate"]:checked').value.trim();
    },
  });

  if(result.isDismissed) {
    return settings;
  }

  const modelName = result.value;
  settings = { modelName };

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
    if (progress.progress == 1) {
      $("#loading_message").text("");
    } else {
      $("#loading_message").text(progress.text + "..");
    }
    console.log("Model loading progress:", progress);
  };
  const engine = await CreateMLCEngine(settings.modelName, { initProgressCallback });
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
  let { instructions } = getSettings() || {};

  if (instructions) {
    return Promise.resolve(instructions);
  } 
  return systemPrompt;
}

export function resetInstructions() {
  return systemPrompt.then(sp => {
    patchAiSettings({ instructions: sp})
    return sp;
  });
}

export function setInstructions(newInstructions) {
  patchAiSettings({ instructions: newInstructions });
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
          { role: "system",
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
