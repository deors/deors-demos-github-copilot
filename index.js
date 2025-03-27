import { Octokit } from "@octokit/core";
import express from "express";
import OpenAI from 'openai';
const app = express();

// this example uses OpenAI gpt-4o model available through GitHub Copilot API
// so it does not require a separate OpenAI API key

app.get("/", (req, res) => {
    res.send("GitHub Copilot Extension OpenAI Basic is up & running!");
});

app.post("/", express.json(), async (req, res) => {

    // the user token is received as a request header
    const userToken = req.get("X-GitHub-Token");
    const octokit = new Octokit({ auth: userToken });
    const user = await octokit.request("GET /user");
    console.log("Incoming request from user:", user.data.login);

    const oaiClient = new OpenAI({
        baseURL: "https://api.githubcopilot.com",
        apiKey: userToken
    });

    const payload = req.body;
    console.log("Request payload:", payload);

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
})

const port = Number(process.env.PORT || '8765')
app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
