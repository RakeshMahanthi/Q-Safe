
// Helper function to check if key exchange indicates PQC usage
function isPQCKeyExchange(keyExchange) {
    if (!keyExchange) return false;
    const pqcIndicators = ["pqc", "kyber", "ntru", "saber", "frodokem", "ntrulpr", "ntruhps", "mlkem","kem"];
    console.log("Checking key exchange for PQC indicators:", keyExchange);
    return pqcIndicators.some(indicator => keyExchange.toLowerCase().includes(indicator));
}

function isPQCKeyExchangeGroup(keyExchangeGroup) {
    if (!keyExchangeGroup) return false;
    const pqcIndicators = ["pqc", "kyber", "ntru", "saber", "frodokem", "ntrulpr", "ntruhps", "mlkem","kem"];
    return pqcIndicators.some(indicator => keyExchangeGroup.toLowerCase().includes(indicator));
}

// Helper to safe detach from debugger
function safeDetach(debuggerr){
    chrome.debugger.detach(debuggerr,() => void chrome.runtime.lastError);
}

// Helper function to attach and enable debugger for a given tab
async function attachAndEnableDebugger(tabId) {
    const debuggerr = { tabId };
    await new Promise((resolve, reject) => {
        chrome.debugger.attach(debuggerr, "1.3", () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
    await new Promise((resolve, reject) => {
        chrome.debugger.sendCommand(debuggerr, "Network.enable", {}, () => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message)); 
            }
            resolve();
        });
    });
    return debuggerr;
}   


//Listener for CHECK_PQC call
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type !== "CHECK_PQC") return; 
        
    //Here lets use chrome debugger to inspect the webpage and figure out if PQC is enforced
    (async () => {
        
        const {tabId,url,reload} = request;
        const debuggerr = await attachAndEnableDebugger(tabId);

        //If tab reload is requested, then reload the tab to capture the network traffic and check for PQC indicators
        if (reload) {
            await new Promise((resolve) => {
                chrome.tabs.reload(tabId, {bypassCache:true},() => resolve());
            });
        }

        const handler = (debuggerId, message, params) => {
            if (debuggerId.tabId === tabId && message === "Network.responseReceived") {
                const {response, type} = params || {};
                if (type !== "Document") return; //We are only interested in the main document response

                const securityDetails = response?.securityDetails;
                if (!securityDetails) {
                    clean();
                    sendResponse({ ok: false, result: "Unknown", "reason": "No Security details found", observed: { url: response?.url, protocol } });
                    return;
                }   

                const {protocol, keyExchange, keyExchangeGroup, cipher} = securityDetails;

                //Check if keyExchange or keyExchangeGroup indicates PQC usage. 
                // This is a very basic check and can be expanded with more indicators as needed.
                const isPQC = isPQCKeyExchange(keyExchange) || isPQCKeyExchangeGroup(keyExchangeGroup);
                clean();
                if (isPQC) {
                    sendResponse({ ok: true,result: "PQC detected", pqcEnabled : true, details: `Protocol: ${protocol}, Key Exchange: ${keyExchange}, Key Exchange Group: ${keyExchangeGroup}, Cipher: ${cipher}`});
                } else {
                    sendResponse({ ok: true,result: "PQC not detected", pqcEnabled : false, details: `Protocol: ${protocol}, Key Exchange: ${keyExchange}, Key Exchange Group: ${keyExchangeGroup}, Cipher: ${cipher}`});
                }
            }
        };         
        
        //Clean up function to remove event listener and detach debugger
        const clean = () => {
            chrome.debugger.onEvent.removeListener(handler);
            safeDetach(debuggerr)
        };

        chrome.debugger.onEvent.addListener(handler);

    })().catch(error => {
        console.error("Error in CHECK_PQC handler:", error);
        sendResponse({ ok: false, error: error.message || "An error occurred" });
    });

    return true; //Indicates that we will send response asynchronously
});
