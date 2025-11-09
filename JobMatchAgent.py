from langchain_core.tools import tool
from JobMatching import JobMatching  # import your class

# Create a persistent instance of JobMatching so it reuses the Chroma DB
jm = JobMatching(model_name="gemini-2.5-flash-lite", job_list_path="joblist_clean_for_rag.csv")
jm.load_joblist()

@tool("search_jobs", return_direct=False)
def search_jobs(query: str, top_k: int = 10, summarize: bool = False) -> str:
    """
    Search job listings semantically.

    Args:
        query: users CV Summary.
        top_k: Number of results to return (default: 10).
        summarize: If True, summarize each job with the LLM; if False, return raw descriptions.

    Returns:
        A formatted string of summarized or full job results.
    """
    results = jm.exec_query(query, top_k=top_k)
    if False:
        summaries = jm.refine_result(results)
        return "\n\n".join(summaries)
    else:
        return "\n\n".join(results)
    

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model

#openai:gpt-5-nano
#llm=init_chat_model("gemini-2.5-flash-lite", temperature=0.3)
# llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)

tools = [search_jobs]

system_prompt = """
You are an intelligent Job Search Agent.

The user will provide a short summary of their CV. 
Use the `search_jobs` tool to find job listings that best match their skills and interests.

Then, carefully analyze the search results and return the **top 4 most relevant jobs**.

Each job should be represented as a **STRICT JSON object** with the following keys:
- Company
- Salary
- JobTitle
- Remote (must be "yes" or "not")
- Responsibility (≤ 200 words)
- Matching Score (0–100)
- Strength (why the candidate is a good fit)
- Weakness (why it might not be a perfect fit)
- Email

Your response must be a **valid JSON list** of four job objects.
Focus on clarity, concise reasoning, and accurate matching.
"""


agent = create_agent(
    model="google_genai:gemini-2.5-flash-lite",
    #model="openai:gpt-5-nano",
    system_prompt=system_prompt,
    tools=tools,
)

query="Amalia Stuger is a highly accomplished and results-driven professional with dual Master's degrees in Artificial Intelligence and Business IT & Management, following a strong BSc in AI with Honours. Equipped with expertise in Python, MATLAB, and SQL, Amalia brings practical experience in developing digital and technical skills, having led robotics and programming workshops for youth. Her role as a Teaching Assistant further highlights her ability to guide students in complex AI concepts, coding, and robotics. Additionally, her entrepreneurial background as a Salon Owner demonstrates robust leadership in business operations, marketing, and client relations, showcasing a unique blend of technical proficiency, problem-solving, and strategic thinking"
for event in agent.stream(
    {"messages": [{"role": "user", "content": query}]},
    stream_mode="values",
):
    event["messages"][-1].pretty_print()
