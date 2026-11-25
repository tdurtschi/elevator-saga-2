
const lsKey = "elevatorCrushCode_v5";
const backupCodeKey = "develevateBackupCode";
const tsKey = "elevatorTimeScale";

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