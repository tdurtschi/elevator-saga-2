
const aiKey = "ai-settings";
const lspKey = "elevatorCrushPrompt_v1";
const lsKey = "elevatorCrushCode_v5";
const backupCodeKey = "develevateBackupCode";
const tsKey = "elevatorTimeScale";

export const getAiSettings = () => {
  let settingsStr = localStorage.getItem(aiKey);
  let settings = JSON.parse(settingsStr || "null");

  return settings;
}

export const setAiSettings = (settings) => {
    localStorage.setItem(aiKey, JSON.stringify(settings));
}

export const patchAiSettings = (newSettings) => {
  let settings = getAiSettings() || {};
  settings = { ...settings, ...newSettings };
  setAiSettings(settings);
  return settings;
}

export const setPrompt = (prompt) => {
  localStorage.setItem(lspKey, prompt);
}

export const getPrompt = () => {
  return localStorage.getItem(lspKey);
}

export const getCode = () => {
  return localStorage.getItem(lsKey);
}

export const setCode = (code) => {
  localStorage.setItem(lsKey, code);
}

export const setBackupCode = (code) => {
  localStorage.setItem(backupCodeKey, code);
}

export const getBackupCode = () => {
  return localStorage.getItem(backupCodeKey);
}

export const setTimeScale = (timeScale) => {
   localStorage.setItem(tsKey, timeScale);
}

export const getTimeScale = () => {
   return localStorage.getItem(tsKey);
}