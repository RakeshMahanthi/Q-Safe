const output = document.getElementById("output");
const checkButton = document.getElementById("checkButton");
const dot = document.querySelector(".status-dot");
const text = document.querySelector(".status span");

//When check button is clicked
checkButton.addEventListener("click", async () => runPQCCheck());

async function runPQCCheck() {
    const currentActiveTab = await getCurrentActiveTab();
    if (!currentActiveTab?.id) return show("There is no active tab");
    show(`Analyzing tab: ${currentActiveTab.title}`);

    //Check if the current active tab is using PQC by sending a message to the content script
    const response = await chrome.runtime.sendMessage({
        type: "CHECK_PQC",
        tabId: currentActiveTab.id,
        url: currentActiveTab.url,
        reload: true
    });
    if (response?.error) return show(`Error: ${response.error}`);
    if (!response?.result) return show("No result received from content script");

    const { result, pqcEnabled, details } = response;
    if (pqcEnabled) {
        dot.classList.remove("safe", "unsafe");
        dot.classList.add("safe");
        text.textContent = "Hybrid PQC likely";
        show(`This page is using post-quantum cryptography. Details: ${details}`);
    } else {
        dot.classList.add("unsafe");
        text.textContent = "No PQC signals detected";
        show("This page is not using post-quantum cryptography.");
    }   
}

function show(obj) {
    output.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}   

async function getCurrentActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
