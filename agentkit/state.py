from typing import TypedDict, Optional, List, Dict, Any

class AgentState(TypedDict, total=False):
    user_id: str
    user_email: str
    mode: str  # e.g. 'upload_cv', 'job_action'

    cv_id: Optional[str]
    cv_text: Optional[str]
    cv_parsed: Optional[Dict[str, Any]]
    cv_embedding: Optional[List[float]]

    jobs: Optional[List[Dict[str, Any]]]  # retrieved jobs
    selected_job: Optional[Dict[str, Any]]
    user_action: Optional[str]  # 'like', 'dislike', 'save', 'apply'

    updated_cv_text: Optional[str]
    email_status: Optional[str]

    assistant_message: Optional[str]


from langgraph.graph import StateGraph, END

def build_job_agent():
    graph = StateGraph(AgentState)

    graph.add_node("upload_cv", upload_cv)
    graph.add_node("match_jobs", match_jobs)
    graph.add_node("present_jobs", present_jobs)
    graph.add_node("parse_user_action", parse_user_action)
    graph.add_node("save_action_to_db", save_action_to_db)
    graph.add_node("update_cv_for_job", update_cv_for_job)
    graph.add_node("send_application_email", send_application_email)
    graph.add_node("end_node", end_node)

    # Default edges
    graph.add_edge("upload_cv", "match_jobs")
    graph.add_edge("match_jobs", "present_jobs")
    graph.add_edge("present_jobs", "parse_user_action")
    graph.add_edge("parse_user_action", "save_action_to_db")

    # Conditional edge
    graph.add_conditional_edges(
        "save_action_to_db",
        action_router,
        {
            "update_cv_for_job": "update_cv_for_job",
            "end_node": "end_node"
        }
    )

    graph.add_edge("update_cv_for_job", "send_application_email")
    graph.add_edge("send_application_email", "end_node")

    graph.set_entry_point("upload_cv")
    graph.set_finish_point("end_node")

    return graph.compile()
