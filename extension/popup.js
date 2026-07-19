const input = document.getElementById("apiUrl");
const saved = document.getElementById("saved");

chrome.storage.sync.get("apiUrl", ({ apiUrl }) => {
  if (apiUrl) input.value = apiUrl;
});

document.getElementById("save").addEventListener("click", () => {
  const apiUrl = input.value.trim();
  chrome.storage.sync.set({ apiUrl }, () => {
    saved.textContent = "Saved. Reload your ChatGPT/Claude tab.";
    setTimeout(() => (saved.textContent = ""), 2500);
  });
});
