// Set your domain url here for the frontend
// For some reason i am not able to import from the config file so define frontend url here for now.
const url = "https://api.smalltimedevs.com/ai/hive-engine"

// Ensure code runs after the DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
});

// Helper function to render Markdown with syntax highlighting
function renderMarkdown(text) {
    const html = marked.parse(text, {
        highlight: (code, lang) => {
            return hljs.highlightAuto(code, [lang]).value;
        },
    });
    return html;
}

// Helper function to fetch with timeout
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 10000 } = options; // Set default timeout to 10 seconds
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);
    return response;
}

// Generate AI text and save it as a conversation
async function generateText() {
    const prompt = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Generating...";

    try {
        const response = await fetchWithTimeout(`${url}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
            timeout: 20000, // 20 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const generatedText = result.text || 'No response from model.';
        responseDiv.innerHTML = renderMarkdown(generatedText);
        hljs.highlightAll(); // Apply syntax highlighting

        // Save the generated conversation to localStorage
        saveConversation(generatedText);
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Continue AI text generation based on existing response
async function continueText() {
    const responseDiv = document.getElementById('response');
    const currentText = responseDiv.innerText;
    responseDiv.innerText += "\n\nContinuing...";

    const prompt = `${currentText}\n\nPlease elaborate further and provide additional insights.`;

    try {
        const response = await fetchWithTimeout(`${url}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt }),
            timeout: 20000, // 20 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.text || 'No further response from model.');
        hljs.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerText += `\n\nAn error occurred: ${error.message}`;
    }
}

// Execute command on server and send text to Notepad if required
async function executeCommand() {
    const commandInput = document.getElementById('command-input').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Executing command...";

    try {
        const response = await fetchWithTimeout(`${url}/execute-command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: commandInput }),
            timeout: 20000, // 20 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.output || 'Command executed successfully.');
        hljs.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error executing command:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

// Research and Summarize function
async function researchAndSummarize() {
    const query = document.getElementById('prompt').value;
    const responseDiv = document.getElementById('response');
    responseDiv.innerText = "Researching and summarizing...";

    try {
        const response = await fetchWithTimeout(`${url}/research-and-summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query }),
            timeout: 20000, // 20 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        responseDiv.innerHTML = renderMarkdown(result.summary || 'No summary generated from the research.');
        hljs.highlightAll(); // Apply syntax highlighting
    } catch (error) {
        console.error('Error in research and summarize:', error);
        responseDiv.innerText = `An error occurred: ${error.message}`;
    }
}

async function agentChat() {
    const prompt = document.getElementById('prompt').value.trim();
    const agentResponsesDiv = document.getElementById('agent-responses');
    const summaryBoxDiv = document.getElementById('summary-box');

    if (!prompt) {
        agentResponsesDiv.innerHTML = "<p>Please provide a valid question or task.</p>";
        return;
    }

    try {
        agentResponsesDiv.innerHTML = "Processing...";
        summaryBoxDiv.innerHTML = "";

        const response = await fetchWithTimeout(`${url}/agent-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: prompt }),
            timeout: 820000, // 820 seconds timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Ensure the result has a valid structure
        const agents = result.agents || [];
        const summary = result.summary || "No summary provided.";

        // Inject agent responses with Markdown rendering
        if (agents.length > 0) {
            agentResponsesDiv.innerHTML = agents
                .map(
                    (agent) => `
                    <div class="agent-section">
                        <h3>${agent.name}</h3>
                        <div>${marked.parse(agent.response)}</div> <!-- Render Markdown -->
                    </div>
                `
                )
                .join("");
        } else {
            agentResponsesDiv.innerHTML = "<p>No agent responses available.</p>";
        }

        // Display summary with Markdown rendering
        summaryBoxDiv.innerHTML = marked.parse(summary);
    } catch (error) {
        console.error("Error:", error);
        agentResponsesDiv.innerHTML = `<p>Error: ${error.message}</p>`;
        summaryBoxDiv.innerHTML = "";
    }
}

// Attach functions to the window object for HTML access
window.generateText = generateText;
window.continueText = continueText;
window.agentChat = agentChat;
document.getElementById('research-button').onclick = researchAndSummarize;