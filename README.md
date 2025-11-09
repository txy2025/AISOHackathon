## Quickstart

```bash
# 1) Built the environment
python -m venv venv
venv\Scripts\activate.bat
pip install -U langchain
pip install -U langchain-openai
pip install --upgrade "langgraph-cli[inmem]"
pip install langchain_tavily
```


  """
    JobMatching class for semantic job search and summarization using LangChain, Chroma, and LLMs.

    Methods
    -------
    __init__(model_name, job_list_path)
        Initialize the job matcher with model and data path.

    row_to_doc(row)
        Convert a CSV row into a LangChain Document for embedding.

    load_joblist(rebuild=False)
        Load or build the Chroma vector store.
        - If `rebuild=False` and the DB exists, reuse it.
        - If `rebuild=True`, re-index the CSV and overwrite the DB.

    format_full_row(row)
        Format one job entry into readable text.

    refine_result(results)
        Summarize a list of job descriptions using the specified model (e.g., Gemini or GPT).

    exec_query(qry_str, top_k=5)
        Search for the top-k semantically similar jobs given a query string.
        Returns a list of formatted job descriptions.
    """
