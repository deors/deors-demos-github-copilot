import { Octokit } from "@octokit/core";
import express from "express";
import OpenAI from 'openai';

const app = express();

// this example uses OpenAI gpt-4o model available through OpenAI directly
// therefore it requires your own OpenAI API key

app.get("/", (req, res) => {
    res.send("GitHub Copilot Extension OpenAI YourKey is up & running!");
});

app.post("/", express.json(), async (req, res) => {

    // the user token is received as a request header
    const userToken = req.get("X-GitHub-Token");
    const octokit = new Octokit({ auth: userToken });
    const user = await octokit.request("GET /user");
    console.log("Incoming request from user:", user.data.login);

    // when connecting to OpenAI API directly
    // we cannot use the GitHub user token as the API key
    // but your own API key configured in the environment
    const oaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const payload = req.body;
    console.log("Request payload:", payload);

    // get weather information
    const weatherInfoRaw = await fetch(process.env.WEATHER_API_URL);
    const weatherInfo = await weatherInfoRaw.json();
    console.log("Weather info:", weatherInfo);

    // add system prompt instructions to modify
    // the normal Copilot behavior
    const messages = payload.messages;
    messages.unshift({
        role: "system",
        content: "You are a helpful assistant that replies to user messages as if you were Darth Vader character from Star Wars.",
    });

    messages.unshift({
        role: "system",
        content: `Start every response with the user's name, which is @${user.data.login} and include references to the concept of 'the force' and the 'power of the dark side' from Star Wars movies in your responses. Whenever possible in the conversation, add comments about how everything is easier and faster thanks to the dark side of the force`,
    });

    messages.unshift({
        role: "system",
        content: `During the conversation include frequent references to the weather using one of the facts from this document: ${JSON.stringify(weatherInfo)}`,
    })

    const assistantResponse = await oaiClient.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
        temperature: 0.7,
    });

    // stream the response
        for await (const chunk of assistantResponse) {
        const chunkStr = "data: " + JSON.stringify(chunk) + "\n\n";
        res.write(chunkStr);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
});

const port = Number(process.env.PORT || '8765');

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
