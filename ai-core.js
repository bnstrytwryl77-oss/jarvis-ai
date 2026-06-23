// מנוע פניות משודרג וחסין שגיאות ל-Gemini API
function askGeminiAI(promptText) {
    const geminiKey = localStorage.getItem('gemini_api_key') || "";
    if (!geminiKey) {
        speak("I'm sorry sir, but your security API key is missing.");
        logToTerminal("WARNING", "Gemini API Key missing inside database.", "#ff0055");
        return;
    }

    document.getElementById('hud-status-text').innerText = "THINKING";
    logToTerminal("UPLINK", "Querying cloud networks (Gemini 2.0)...");

    // שליפת משימות אקטיביות מהזיכרון
    const tasks = JSON.parse(localStorage.getItem('jarvis_tasks')) || [];
    const taskContext = tasks.length > 0 ? `Your current active tasks are: ${tasks.join(', ')}.` : "You have no active tasks currently.";

    const systemPrompt = `You are J.A.R.V.I.S., the highly advanced, witty, and loyal AI assistant from Iron Man. Keep your answers relatively short, cool, and always address the user as 'sir'. Context: ${taskContext} Command: ${promptText}`;

    // הכתובת המעודכנת ביותר של גוגל למודל פלאש 2.0
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(errData => {
                // חילוץ השגיאה המדויקת של גוגל
                throw new Error(errData.error?.message || `HTTP Status ${res.status}`);
            }).catch(() => {
                throw new Error(`Network response error: ${res.status}`);
            });
        }
        return res.json();
    })
    .then(data => {
        document.getElementById('hud-status-text').innerText = "ACTIVE";
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            let textResponse = data.candidates[0].content.parts[0].text;
            logToTerminal("AI_CORE", "Telemetry uplink complete.", "green");
            speak(textResponse);
        } else {
            throw new Error("Payload readable but format is unexpected.");
        }
    })
    .catch(err => {
        document.getElementById('hud-status-text').innerText = "ERROR BREAK";
        // מדפיס את השגיאה האמיתית ישירות לתוך הלוח השחור באתר!
        logToTerminal("AI_ERROR", err.message, "#ff0055"); 
        speak("Forgive me sir, my core network returned an error. Please check the terminal.");
        console.error("JARVIS Core Error:", err);
    });
}
