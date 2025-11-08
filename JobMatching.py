import os
import pandas as pd
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

# Use a chat model for summarization
from langchain_google_genai import ChatGoogleGenerativeAI  # for Gemini
# from langchain_openai import ChatOpenAI  # uncomment if you want OpenAI chat

load_dotenv(override=True)


class JobMatching:
    def __init__(self, model_name: str, job_list_path: str, default_k: int = 5) -> None:
        self.model_name = model_name  # e.g. "google_genai:gemini-2.5-flash-lite"
        self.job_list_path = job_list_path
        self.df = None
        self.df_by_id = None
        self.search_param = default_k

        # Embeddings: OpenAI (ensure OPENAI_API_KEY is set)
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

        self.vector_store = None
        self.retriever = None

    def row_to_doc(self, row):
        desc = row.get("description", "") if isinstance(row, dict) else row["description"]
        content = (
            f"Title: {row['title']}\n"
            f"Company: {row['company']}\n"
            f"Location: {row['location']}\n"
            f"Remote: {row['remote']}\n"
            f"Department: {row['department']}\n"
            f"Description:\n{desc}"
        ).strip()
        metadata = {
            "doc_id": row["doc_id"],
            "title": row["title"],
            "company": row["company"],
            "location": row["location"],
            "remote": row["remote"],
            "department": row["department"],
        }
        return Document(page_content=content, metadata=metadata)

    def load_joblist(self):
        self.df = pd.read_csv(self.job_list_path)
        self.df = self.df.fillna("").reset_index(drop=False).rename(columns={"index": "doc_id"})
        self.df["doc_id"] = self.df["doc_id"].astype(str)

        base_docs = [self.row_to_doc(r) for _, r in self.df.iterrows()]
        print(f"Loaded {len(base_docs)} base docs")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1200,
            chunk_overlap=150,
            separators=["\n\n", "\n", " ", ""],
        )

        chunked_docs = []
        for d in base_docs:
            for i, ch in enumerate(splitter.split_text(d.page_content)):
                md = dict(d.metadata)
                md["chunk"] = i
                chunked_docs.append(Document(page_content=ch, metadata=md))

        print(f"Prepared {len(chunked_docs)} chunks")

        self.vector_store = Chroma(
            collection_name="jobs_rag",
            embedding_function=self.embeddings,
            persist_directory="./chroma_langchain_n_db",
        )

        BATCH_SIZE = 100
        ids = []
        for i in range(0, len(chunked_docs), BATCH_SIZE):
            batch = chunked_docs[i : i + BATCH_SIZE]
            ids.extend(self.vector_store.add_documents(batch))

        print("Example IDs:", ids[:3])
        print("Done indexing.")

        self.df_by_id = self.df.set_index("doc_id", drop=False)
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": self.search_param})

    def format_full_row(self, row):
        return (
            f"Title: {row['title']}\n"
            f"Company: {row['company']}\n"
            f"Location: {row['location']}\n"
            f"Remote: {row['remote']}\n"
            f"Department: {row['department']}\n"
            f"Description:\n{row['description']}"
        ).strip()

    def _get_chat_model(self):
        """
        Returns a chat model instance based on self.model_name.
        Default: Gemini via langchain_google_genai.
        """
        # If you want to switch on prefixes, do it here.
        # For now assume Gemini name is passed.
        return ChatGoogleGenerativeAI(model=self.model_name, temperature=0)

        # For OpenAI instead:
        # return ChatOpenAI(model=self.model_name, temperature=0)

    def refine_result(self, results: list):
        chat = self._get_chat_model()

        system = (
            "You summarize job descriptions. Return STRICT JSON only with keys: "
            'Company, JobTitle, Remote, Description, Requirements, Email. '
            'Remote must be "yes" or "not". Keep Description ≤ 200 words.'
        )

        refined = []
        for job_text in results:
            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": f"Summarize this job:\n\n{job_text}\n\nReturn only JSON."},
            ]
            resp = chat.invoke(messages)
            refined.append(resp.content.strip())
            print(resp.content.strip())
        return refined

    def exec_query(self, qry_str: str, top_k: int = 5):
        # allow per-call k override
        retriever = (
            self.vector_store.as_retriever(search_kwargs={"k": top_k})
            if self.vector_store is not None
            else self.retriever
        )
        if retriever is None:
            raise RuntimeError("Retriever not initialized. Did you call load_joblist()?")

        chunks = retriever.invoke(qry_str)

        seen = set()
        results = []
        for ch in chunks:
            did = ch.metadata["doc_id"]
            if did in seen:
                continue
            seen.add(did)
            row = self.df_by_id.loc[did]
            results.append(self.format_full_row(row))
            if len(results) >= top_k:
                break
        return results


if __name__ == "__main__":
    jm = JobMatching(
        model_name="gemini-2.5-flash-lite",  # Google Generative AI chat model name
        job_list_path="joblist_clean_for_rag.csv",
    )
    jm.load_joblist()
    query = "skills: python, new graduate, Amsterdam, Computer Science, AI, Data Science"
    results = jm.exec_query(query, top_k=5)
    summaries = jm.refine_result(results)
    for s in summaries:
        print("\n--- SUMMARY ---\n", s)
