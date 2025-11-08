from langchain_openai import ChatOpenAI
import os

GPT5_API_BASE = "https://fj7qg3jbr3.execute-api.eu-west-1.amazonaws.com/v1"
GPT5_API_KEY = os.getenv("OPENAI_API_KEY")  # same variable you used in curl

llm = ChatOpenAI(
    model="gpt-5-nano",
    openai_api_base=GPT5_API_BASE,
    openai_api_key=GPT5_API_KEY,
)
