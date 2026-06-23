const initBtn = document.getElementById('init-btn');
const bootScreen = document.getElementById('boot-screen');
const hudContainer = document.getElementById('hud-container');
const statusText = document.getElementById('hud-status-text');
const titleText = document.getElementById('hud-title');
const speechPanel = document.getElementById('jarvis-speech');
const terminal = document.getElementById('system-terminal');
const keyBtn = document.getElementById('key-btn');
const batteryStatus = document.getElementById('battery-status');

let recognition;
let isAsleep = true;
let explicitStop = false; 

initBtn.addEventListener('click', () => {
    bootScreen.style.opacity = '0';
    setTimeout(() => {
        bootScreen.style.display = 'none';
        hudContainer.style.display = 'flex';
        logToTerminal("SYSTEM", "Uplink stable. Visual layout synchronized.", "cyan");
        updateBattery();
        renderTasks();
        startVoiceEngine();
    }, 600);
});

keyBtn.addEventListener('click', () => {
    let key = prompt("Enter Gemini API Key:");
    if(key) {
        localStorage.setItem('gemini_api_key', key);
        logToTerminal("SECURITY", "API Key loaded locally into storage.", "green");
        speechPanel.innerText = "Key updated, sir.";
    }
});

function logToTerminal(sender, message, color = "#a0aec0") {
    const time = new Date().toLocaleTimeString();
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<span style="color: #4a5568">[${time}]</span> <span style="color: ${color}">[${sender}]</span> ${message}`;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

// שאיבת נתוני סוללה מהדפדפן
function updateBattery() {
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            batteryStatus.innerText = `BATTERY: ${Math.round(battery.level * 100)}%`;
            battery.onlevelchange = () => {
                batteryStatus.innerText = `BATTERY: ${Math.round(battery.level * 100)}%`;
            };
        });
    }
}

// מנוע האזנה
function startVoiceEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        logToTerminal("ERROR", "SpeechRecognition unavailable.", "red");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript.toLowerCase().trim();
        logToTerminal("HEARD", `"${transcript}"`, "#cbd5e1");

        if (isAsleep) {
            if (transcript.includes("jarvis wake up") || transcript.includes("wake up")) {
                wakeUp();
            } else {
                speechPanel.innerText = "System Locked. Say 'Jarvis, wake up'...";
            }
        } else {
            if (transcript.includes("go to sleep") || transcript.includes("system sleep")) {
                goToSleep();
            } else {
                speechPanel.innerText = `Processing: "${transcript}"`;
                processLiveCommand(transcript);
            }
        }
    };

    recognition.onend = () => { if (!explicitStop) try { recognition.start(); } catch(e) {} }; 
    recognition.start();
}

function wakeUp() {
    isAsleep = false;
    document.body.classList.add('active');
    titleText.innerText = "JARVIS: ONLINE";
    statusText.innerText = "ACTIVE";
    logToTerminal("SYS", "Security handshake approved.", "var(--neon-cyan)");
    speak("Systems operational. Welcome back, sir.");
}

function goToSleep() {
    isAsleep = true;
    document.body.classList.remove('active');
    titleText.innerText = "JARVIS: DORMANT";
    statusText.innerText = "STANDBY";
    logToTerminal("SYS", "Power conservation protocol initialized.", "var(--neon-red)");
    speak("Understood, entering standby.");
}

// עיבוד פקודות חכם
function processLiveCommand(command) {
    if (command.includes("open youtube")) { window.open("https://www.youtube.com", "_blank"); speak("Opening YouTube, sir."); return; }
    if (command.includes("open google")) { window.open("https://www.google.com", "_blank"); speak("Opening Google."); return; }
    if (command.includes("open tiktok")) { window.open("https://www.tiktok.com", "_blank"); speak("Opening TikTok."); return; }
    
    // הוספת משימה קולית! למשל: "add a task study for the exam"
    if (command.includes("add a task") || command.includes("add task")) {
        let task = command.replace("add a task", "").replace("add task", "").trim();
        if(task) {
            manageTasks('add', task);
            speak(`I have added ${task} to your active directives, sir.`);
        }
        return;
    }

    // מחיקת משימות קולית
    if (command.includes("clear all tasks") || command.includes("clear tasks")) {
        manageTasks('clear');
        speak("Directives cleared from database, sir.");
        return;
    }

    if (command.includes("time")) {
        const now = new Date();
        speak(`The current time is ${now.getHours()} ${now.getMinutes().toString().padStart(2, '0')}.`);
        return;
    }

    // שליחה לבינה המלאכותית (נמצא ב-ai-core.js)
    if (typeof askGeminiAI === "function") {
        askGeminiAI(command);
    } else {
        speak("AI layer offline.");
    }
}

// ניהול המשימות במסך וב-Storage
function manageTasks(action, taskText = "") {
    let tasks = JSON.parse(localStorage.getItem('jarvis_tasks')) || [];
    if (action === 'add' && taskText) {
        tasks.push(taskText);
    } else if (action === 'clear') {
        tasks = [];
    }
    localStorage.setItem('jarvis_tasks', JSON.stringify(tasks));
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('task-list');
    let tasks = JSON.parse(localStorage.getItem('jarvis_tasks')) || [];
    list.innerHTML = "";
    if(tasks.length === 0) {
        list.innerHTML = "<li>No pending directives.</li>";
    } else {
        tasks.forEach(t => {
            const li = document.createElement('li');
            li.innerText = t;
            list.appendChild(li);
        });
    }
}

// מנוע הדיבור (TTS)
function speak(text) {
    explicitStop = true; 
    if (recognition) try { recognition.stop(); } catch(e) {}
    
    speechPanel.innerText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 0.85;

    utterance.onend = () => { 
        if(!isAsleep) statusText.innerText = "ACTIVE";
        explicitStop = false; 
        if (recognition) try { recognition.start(); } catch(e) {}
    };
    window.speechSynthesis.speak(utterance);
}
