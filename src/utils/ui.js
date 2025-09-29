// src/utils/ui.js
export const desbloquearInterfaz = () => {
  setTimeout(() => {
    document.body.style.pointerEvents = "auto";
    document.body.focus();
  }, 100);
};
