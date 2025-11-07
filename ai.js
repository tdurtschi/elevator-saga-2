import Swal from "sweetalert2";
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import $ from "jquery";

const aiKey = "ai-settings";

const models = [
  "Hermes-3-Llama-3.2-3B-q4f16_1-MLC", 
  "Llama-3.2-1B-Instruct-q4f32_1-MLC",
  "Qwen3-0.6B-q4f16_1-MLC"
];

const model = models[0];

export const fetchSettings = async () => {
  let settingsStr = localStorage.getItem(aiKey);
  let settings = JSON.parse(settingsStr || "{}");
  const result = await Swal.fire({
    title: "AI Settings",
    theme: "dark",
    html: `
                <p>AI prompts require a browser compable with <a href="https://webllm.mlc.ai/">WebLLM</a>.</p>
                Model name: 
                ${models.map(model => "<br><label><input type='radio' name='rate' value='" + model + "'" + (settings?.modelName === model ? " checked" : "") + "> " + model + "</label>").join('')}
            `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return document.querySelector('input[name="rate"]:checked').value.trim();
    },
  });

  const modelName = result.value;
  settings = { modelName };

  return settings;
};

const getSettings = async () => {
  let settings;
  let settingsStr = localStorage.getItem(aiKey);
  if (settingsStr) {
    settings = JSON.parse(settingsStr);
  } else {
    settings = await fetchSettings();
    localStorage.setItem(aiKey, JSON.stringify(settings));
  }
  return settings;
}

const createClient = async () => { 
  const initProgressCallback = (progress) => {
    if (progress.progress == 1) {
      $("#loading_message").text("");
    } else {
      $("#loading_message").text(progress.text + "..");
    }
    console.log("Model loading progress:", progress);
  };
  var settings = await getSettings();
  const engine = await CreateMLCEngine(settings.modelName, { initProgressCallback });
  return engine;
};

let client;

export const defaultPrompt =
  "When the elevator is idle, it should go to floor 0, then floor 1, and repeat.\n";

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

  if (!client) {
    client = await createClient();
  }

  return systemPrompt
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
