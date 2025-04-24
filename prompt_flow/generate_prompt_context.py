from typing import List
from promptflow import tool
from promptflow_vectordb.core.contracts import SearchResultEntity


@tool
def generate_prompt_context(search_result: List[dict]) -> str:
    def format_doc(doc: dict):
        return f"Content: {doc['Content']}\nSource: {doc['Source']}"

    METADATA_SOURCE_KEY = "source"
    METADATA_URL_KEY = "url"
    ADDITIONAL_URL_KEY = "url"

    retrieved_docs = []
    for item in search_result:

        entity = SearchResultEntity.from_dict(item)
        content = entity.text or ""

        source = ""
        if entity.metadata is not None:
            if METADATA_SOURCE_KEY in entity.metadata:
                if METADATA_URL_KEY in entity.metadata[METADATA_SOURCE_KEY]:
                    source = entity.metadata[METADATA_SOURCE_KEY][METADATA_URL_KEY] or ""
        elif entity.additional_fields is not None:
            if ADDITIONAL_URL_KEY in entity.additional_fields:
                source = entity.additional_fields[ADDITIONAL_URL_KEY] or ""

        retrieved_docs.append({
            "Content": content,
            "Source": source
        })
    doc_string = "\n\n".join([format_doc(doc) for doc in retrieved_docs])
    return doc_string
