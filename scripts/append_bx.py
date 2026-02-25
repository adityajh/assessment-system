import re

bx_map = [
    ("Commercial", "Financial Literacy & Analysis", "How confidently can I calculate and interpret key financial metrics like break-even, cost structure, and ROI for the business I studied?"),
    ("Commercial", "Budgeting & Forecasting", "How accurately was I able to estimate revenues, costs, and financial risks using field data and assumptions?"),
    ("Commercial", "Negotiation & Vendor Management", "How effectively did I communicate with owners/staff to gather accurate operational and financial information?"),
    ("Entrepreneurial", "Market Research & Opportunity Recognition", "How well was I able to identify customer needs, frustrations, and emerging opportunities through observation and questioning?"),
    ("Entrepreneurial", "Business Model & Lean Execution", "How clearly can I map and explain the business model (BMC) and identify what drives value?"),
    ("Entrepreneurial", "Networking & Pitching", "How confidently and clearly was I able to present insights and defend my analysis during the pitch?"),
    ("Marketing", "Content & Communication", "How clearly and persuasively did I communicate complex insights in my slides, visuals, and presentation?"),
    ("Marketing", "Marketing Strategy & Execution", "How well do I understand the target customers, competitive landscape, and external forces influencing the business?"),
    ("Marketing", "Analysis & Optimization", "How effectively could I identify inefficiencies, risks, or optimization opportunities in the business?"),
    ("Innovation", "Ideation & Creativity", "How creatively was I able to uncover deeper patterns or hidden levers affecting the business?"),
    ("Innovation", "Customer-Centered Insights", "How well did I understand customer behavior and translate it into meaningful insights?"),
    ("Innovation", "Business & System Mapping", "How accurately and completely was I able to map the business system using strategy frameworks?"),
    ("Operational", "Planning & Collaboration", "How effectively did I plan tasks and collaborate with my team to complete all project requirements?"),
    ("Operational", "Problem-Solving & Risk Management", "How well was I able to identify key risks and explain business vulnerabilities?"),
    ("Operational", "Process & Project Management", "How effectively did I analyze business processes and manage my workflow?"),
    ("Operational", "Documentation & Reporting", "How thorough and well-organized was my documentation across all frameworks and deliverables?"),
    ("Commercial", "Accounting & Compliance", "How well can I explain the different roles, functions, and systems that make a business run?"),
    ("Professional", "Professional Conduct & Ethics", "How professionally did I conduct myself during field visits, interviews, and team interactions?"),
    ("Professional", "Continuous Growth & Reflection", "How deeply did I reflect on my learnings and apply feedback throughout the project?"),
    ("Professional", "Networking & Presence", "How confidently did I build rapport and ask meaningful questions to people involved in the business?")
]

lines_to_append = []
for domain, param, q in bx_map:
    # Format: | Business X-Ray | Commercial | Financial Literacy & Analysis | Question Text |
    lines_to_append.append(f"| Business X-Ray | {domain} | {param} | {q} |")

with open("scripts/semantic_mapping.md", "a") as f:
    f.write("\n" + "\n".join(lines_to_append) + "\n")
