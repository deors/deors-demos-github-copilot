# deors-demos-github-copilot

A collection of GitHub Copilot Extension examples.

Each example is available as a different branch so they can be easily deployed as Azure App Services.

## copilot-openai-basic

A simple GitHub Copilot extension that uses OpenAI gpt-4o model provided by GitHub Copilot API modified to respond to user requests impersonating Darth Vader and with references to 'the force'.

Available in branch `01-copilot-openai-basic`.

## copilot-openai-weather

Based on `copilot-openai-basic` but additionally this extension will add references to the weather obtained by consuming a third-party weather forecasting service configured with the environment variable `WEATHER_API_URL`. For example, in Spain you may use `https://www.el-tiempo.net/api/json/v2/home`.

Available in branch `02-copilot-openai-weather`.

## copilot-openai-apikey

Same as `copilot-openai-weather` but using OpenAI API directly. Therefore, it requires your own OpenAI API key to work. To provide it, use the environment variable `OPENAI_API_KEY` when configuring the deployment.

Available in branch `03-copilot-openai-apikey`.

## copilot-aifoundry-modelclient

This extension will leverage an inference model deployed in Azure AI Foundry. To integrate with the right model three environment variables are required: `MODEL_API_KEY` is the model API key configured in AI Foundry, `MODEL_API_URL` is the URL to the endpoint where the model is published, and `MODEL_NAME` is the name of the model instance. As the integration is done through the `Model Client` Azure AI inference interface, the example should work with any model deployed in AI Foundry.

Available in branch `04-copilot-aifoundry-modelclient`.

## copilot-aifoundry-promptflow

This extension interacts with Azure AI Foundry Prompt flows. To integrate with the right flow three environment variables are required: `MODEL_API_KEY` is the model API key configured in AI Foundry, `MODEL_API_URL` is the URL to the endpoint where the model is published, and `MODEL_NAME` is the name of the model instance. The integration is done through direct REST API calls matching the expected parameters as defined in the Prompt flow. Therefore, although the example is quite generic it may need adjustments when different input/output interfaces are defined in the target Prompt flow.

Available in branch `05-copilot-aifoundry-promptflow`.
