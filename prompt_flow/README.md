# Example Prompt flow for Q&A with RAG context

This example demonstrates a chatbot that uses LLM and data from your own indexed files to ground multi-round question and answering capabilities in enterprise chat scenarios.

This example is designed to be integrated with GitHub Copilot through the custom extension provided within this repository.

## Prerequisites

- Deployed model: A deployed model within Azure AI Foundry.
- Connection: Azure OpenAI connection.
- Search: Vector search service.
- Data and indexes: Any collection of your own custom data to enrich chatbot responses.

## Tools used in this flow

* LLM tool
* Embedding tool
* Vector Index Lookup tool
* Python tool
