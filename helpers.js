import { v4 as uuidv4 } from 'uuid';

// process the request payload and build the final message to send to the model
export function processMessages(messages) {
    const fileReferences = extractFileReferences(messages);
    const fileContext = formatFileContext(fileReferences);
    const question = messages.reverse().find(
        msg => msg.role === "user" && msg.content)?.content || "Hello";
    const chatHistory = generateChatHistory(messages);

    return JSON.stringify({
        chat_input: question,
        chat_history: chatHistory,
        chat_files: fileContext,
    });
}

function extractFileReferences(messages) {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.copilot_references?.filter(ref =>
        ref.type === "client.file" || ref.type === "client.selection"
    ) || [];
}

function formatFileContext(fileReferences) {
    return fileReferences.map(ref => {
        if (ref.type === "client.file") {
            return `File ${ref.id} content: ${ref.data.content}`;
        } else if (ref.type === "client.selection") {
            return `File ${ref.id} analyze this part: ${ref.data.content}`;
        }
        return "";
    }).join("\n\n");
}

// generate the chat history from the request payload
function generateChatHistory(messages) {
    return messages
        .filter(msg => msg.role === "user" || msg.role === "assistant")
        .slice(0, -1)
        .map(msg => ({
            inputs: { chat_input: msg.content },
            outputs: { chat_output: msg.role === "assistant" ? msg.content : null },
        }));
}

// process the response in streaming mode
export async function processResponseText(text, res, responseEnded) {
    const lines = text.split("\n").filter(line => line.trim() !== "");
    for (const line of lines) {
        if (line.startsWith("data:")) {
            const jsonData = line.replace("data: ", "").trim();
            try {
                const parsedData = JSON.parse(jsonData);

                if (parsedData.chat_output) {
                    parsedData.chat_output = parsedData.chat_output.replace('</think>', '&lt;/think&gt;');

                    const responseChunk = createResponseChunk(parsedData, false);

                    if (!responseEnded) {
                        const responseData = `data: ${JSON.stringify(responseChunk)}\n\n`;
                        res.write(responseData);
                        process.stdout.write(parsedData.chat_output);
                    }
                }
            } catch (error) {
                console.error("Error parsing JSON: ", error);
            }
        }
    }

    console.log("End of streaming response");

    if (!responseEnded) {
        const responseChunk = createResponseChunk(JSON.parse("{}"), true);
        const responseData = `data: ${JSON.stringify(responseChunk)}\n\n`;
        res.write(responseData);
        res.end();
        responseEnded = true;
        return;
    }
}

export function createResponseChunk(parsedData, isLastToken) {
    return {
        choices: [
            {
                index: 0,
                delta: isLastToken ? {} : {
                    content: parsedData.chat_output || "",
                    reasoning_content: null,
                    role: "assistant",
                    tool_calls: null
                },
                logprobs: null,
                finish_reason: isLastToken ? "stop" : null
            }
        ],
        created: Math.floor(Date.now() / 1000),
        id: uuidv4(),
        model: process.env.MODEL_NAME,
        object: "chat.completion.chunk",
        usage: null
    };
}
