import express from "express";
import { Octokit } from "@octokit/core";
import { AzureKeyCredential } from "@azure/core-auth";
import ModelClient from "@azure-rest/ai-inference";
import { createSseStream } from "@azure/core-sse";

const app = express();

// this example uses any model deployed to Azure AI Foundry
// using the Azure Model Client SDK
// therefore it requires the model name, API URL and API key

app.get("/", (req, res) => {
    res.send("GitHub Copilot Extension AI Foundry is up & running!");
});

app.post("/", express.json(), async (req, res) => {

    try {
        // validate that required environment variables are set
        if (!process.env.MODEL_NAME
            || !process.env.MODEL_API_KEY
            || !process.env.MODEL_API_URL) {
            return res.status(500).send("The required environment variables are missing");
        }

        // the user token is received as a request header
        const userToken = req.get("X-GitHub-Token");
        const octokit = new Octokit({ auth: userToken });
        const user = await octokit.request("GET /user");
        console.log("Incoming request from user:", user.data.login);

        const payload = req.body;
        console.log("Request payload:", payload);

        const messages = payload?.messages || [];

        if (!messages.length) {
            return res.status(400).send("The request body does not contain a valid message");
        }

        // set the system prompt
        messages.unshift({
            role: "system",
            content: "You are a helpful assistant that replies to user messages as if you were Darth Vader character from Star Wars.",
        });

        messages.unshift({
            role: "system",
            content: `Start every response with the user's name, which is @${user.data.login} and include references to the concept of 'the force' and the 'power of the dark side' from Star Wars movies in your responses. Whenever possible in the conversation, add comments about how everything is easier and faster thanks to the dark side of the force`,
        });

        // extract file references from the incoming request and build the file context
        // this would be typically the file opened in the IDE
        const fileReferences = messages[messages.length - 1]?.copilot_references?.filter(ref =>
            ref.type === "client.file" || ref.type === "client.selection"
        ) || [];
    
        const fileContext = fileReferences.map(ref => {
            if (ref.type === "client.file") {
                return `Use as reference file ${ref.id} content: ${ref.data.content}`;
            } else if (ref.type === "client.selection") {
                return `Use as reference file ${ref.id} selection: ${ref.data.content}`;
            }
            return "";
        }).join("\n\n");

        if (fileContext) {
            messages.unshift({
                role: "system",
                content: "If the file is empty or not relevant to the conversation, just ignore it and restate the original question",
            });

            messages.unshift({
                role: "user",
                content: fileContext,
            });
        }

        const modelApiKeyCredential = new AzureKeyCredential(process.env.MODEL_API_KEY);
        const modelApiUrl = process.env.MODEL_API_URL;
        const modelName = process.env.MODEL_NAME;

        const client = new ModelClient(modelApiUrl, modelApiKeyCredential);

        console.log("Sending request to the model deployed in Azure AI Foundry");

        const modelResponse = await client.path("/chat/completions").post({
            body: {
                messages,
                model: modelName,
                stream: true
            }
        }).asNodeStream();

        console.log("Processing response");

        if (modelResponse.status !== "200") {
            console.error(`Request failed with status ${modelResponse.status}`);
            throw new Error(`Request failed with status ${modelResponse.status}`);
        }

        const stream = modelResponse.body;
        if (!stream) {
            console.error("The model response stream is undefined");
            throw new Error("The model response stream is undefined");
        }

        // add headers for streaming the response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sses = createSseStream(stream);
        for await (const event of sses) {
            if (event.data === "[DONE]") {
                console.log("Streaming completed");
                res.write("data: [DONE]\n\n");
                res.end();
                return;
            } else {
                const chunkStr = `data: ${JSON.stringify(JSON.parse(event.data))}\n\n`;
                console.log(`Chunk received: ${chunkStr}`);
                res.write(chunkStr);
                for (const choice of (JSON.parse(event.data)).choices) {
                    process.stdout.write(choice.delta?.content ?? ``);
                }
            }
        }
        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error(`Internal error: ${error}`);
        res.write("data: [DONE]\n\n");
        res.end();
        res.status(500).send("Internal error while processing the request");
    }
});

const port = Number(process.env.PORT || '8765');

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
