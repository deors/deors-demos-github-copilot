import express from "express";
import fetch from "node-fetch";
import { processMessages, processResponseText } from "./helpers.js";

const app = express();

// this example uses any model deployed to Azure AI Foundry
// and Prompt flow to define the agent's behavior
// therefore it requires the API URL and API key where the model is deployed

app.get("/", (req, res) => {
    res.send("GitHub Copilot Extension AI Foundry with Prompt flow is up & running!");
});

app.post("/", express.json(), async (req, res) => {

    try {
        const payload = req.body;
        const messages = payload?.messages || [];

        if (!messages.length) {
            return res.status(400).send("The request body does not contain a valid message");
        }

        // validate that required environment variables are set
        if (!process.env.MODEL_API_KEY
            || !process.env.MODEL_API_URL) {
            return res.status(500).send("The required environment variables are missing");
        }

        // call the function to process the messages
        const raw = processMessages(messages);

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "text/event-stream");
        myHeaders.append("Authorization", "Bearer " + process.env.MODEL_API_KEY);

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };

        // add headers for streaming response
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // ask the model
        fetch(process.env.MODEL_API_URL, requestOptions)
            .then((response) => {
                if (response.ok) {
                    console.log("Response received from the model");
                    return response.text();
                } else {
                    console.error(`Request failed with status code ${response.status}`);
                    throw new Error(`Request failed with status code ${response.status}`);
                }
            })
            .then((text) => {
                processResponseText(text, res, false);
            })
            .catch((error) => {
                console.error(`Fetch error while processing the request: ${error}`);
                res.status(500).send("Fetch error while processing the request");
            });
    } catch (error) {
        console.error(`Internal error while processing the request ${error}`);
        res.status(500).send("Internal error while processing the request");
    }
});

const port = Number(process.env.PORT || '8765');

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
