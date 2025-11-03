import OpenAI from "openai";
import Swal from "sweetalert2";

const aiKey = "ai-settings";
let settingsStr = localStorage.getItem(aiKey);
let settings;
if (settingsStr) {
  settings = JSON.parse(settingsStr);
}

export const updateSettings = async () => {
  const shouldReloadAfterUpdate = settings !== null;
  const result = await Swal.fire({
    title: "AI Settings",
    theme: "dark",
    html: `
                <p>AI prompts require an OpenAI-compatible API. Please add API details below:</p>
                Url: <input id="swal-api-url" class="swal2-input" value="${
                  settings?.apiUrl ?? ""
                }" placeholder="API URL (e.g. http://localhost:8080/v1/chat)">
                <br/>
                API Key: <input id="swal-api-key" class="swal2-input" value="${
                  settings?.apiKey ?? ""
                }" placeholder="API Key">
                <br/>
                Model: <input id="swal-model-name" class="swal2-input" value="${
                  settings?.modelName ?? ""
                }" placeholder="Model Name (e.g. huggingfacetb_smollm3-3b)">
            `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return [
        document.getElementById("swal-api-url").value.trim(),
        document.getElementById("swal-api-key").value.trim(),
        document.getElementById("swal-model-name").value.trim(),
      ];
    },
  });

  const [apiUrl, apiKey, modelName] = result.value;
  settings = { apiUrl, apiKey, modelName };
  localStorage.setItem(aiKey, JSON.stringify(settings));
  if(shouldReloadAfterUpdate) {
    location.reload();
  }

  return settings;
};

const createClient = async () => {
  let settingsStr = localStorage.getItem(aiKey);
  if (settingsStr) {
    settings = JSON.parse(settingsStr);
  }

  if (!settings) {
    settings = await updateSettings();
  }

  const client = new OpenAI({
    baseURL: settings.apiUrl,
    apiKey: settings.apiKey,
    dangerouslyAllowBrowser: true,
  });
  return client;
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
        model: settings.modelName,
        seed: 0,
        messages: [
          {
            role: "user",
            content: `${sp}\n The player's prompt is: "${query}"`,
          },
        ],
      })
    )
    .then((response) => response.choices[0].message.content)
    .then(sanitizeResponse);
}
