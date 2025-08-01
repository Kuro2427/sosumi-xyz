#!/usr/bin/env python3

#!/usr/bin/env python3

def generate_quiz(questions, result_levels, output_file="quiz.html"):
    # Build the questions HTML separately
    question_blocks = []
    for i, q in enumerate(questions):
        options_html = ""
        for j, option in enumerate(q['options']):
            options_html += f"""
                <div class="option" id="option{i}-{j}">
                    <input type="radio" id="q{i}o{j}" name="q{i}" value="{j}">
                    <label for="q{i}o{j}">{option}</label>
                    <span class="feedback" id="feedback{i}-{j}"></span>
                </div>"""
        question_html = f"""
            <div class="question" id="q{i}">
                <p>{i+1}. <span id="questionText{i}">{q['question']}</span></p>
                {options_html}
                <div class="explanation" id="explanation{i}">{q['explanation']}</div>
            </div>"""
        question_blocks.append(question_html)

    questions_html = ''.join(question_blocks)

    correct_answers_list = [q['correct'] for q in questions]
    max_options = max(len(q['options']) for q in questions)

    html_template = f"""<!DOCTYPE html>
<html>
<head>
    <title>Trivia Quiz</title>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .question {{ margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }}
        .explanation {{ color: #666; font-style: italic; display: none; margin-top: 5px; }}
        .correct {{ color: green; }}
        .incorrect {{ color: red; }}
        #result {{ font-weight: bold; font-size: 1.2em; margin: 20px 0; }}
        .result-img {{ max-width: 300px; margin: 10px 0; }}
        .feedback {{ 
            margin-left: 8px;
            font-weight: bold;
            display: none;
        }}
        .correct-feedback {{ color: green; }}
        .incorrect-feedback {{ color: red; }}
        #submitBtn {{ transition: opacity 0.3s; }}
        #submitBtn.hidden {{ display:none; }}
        .unanswered {{ border-left: 3px solid orange; padding-left: 5px; }}
    </style>
</head>
<body>
    <h1>Trivia Quiz</h1>
    <form id="quizForm">
        {questions_html}
    </form>
    
    <button id="submitBtn" onclick="validateQuiz()">Submit Quiz</button>
    
    <div id="result"></div>
    <div id="resultImg"></div>
    <div id="resultParagraph"></div>
    
    <!--Change these variables to make sense for your quiz-->  

    <script>
        const correctAnswers = {correct_answers_list};
        const resultLevels = {result_levels};
        const resultImages = {{
            "Trivia Pro": "https://example.com/trivia-pro.png",
            "Wow you exist!": "https://example.com/you-exist.png",
            "Brainlet": "https://example.com/brainlet.png"
        }};
        const resultParagraphs = {{
            "Trivia Pro": "You are good at trivia.",
            "Wow you exist!": "Whatever.",
            "Brainlet": "Are you doing this on purpose?"
        }};
        
        function validateQuiz() {{
            let allAnswered = true;
            
            for (let i = 0; i < {len(questions)}; i++) {{
                const questionElement = document.getElementById(`q${{i}}`);
                const selectedOption = document.querySelector(`input[name="q${{i}}"]:checked`);
                
                if (!selectedOption) {{
                    allAnswered = false;
                    questionElement.classList.add('unanswered');
                }} else {{
                    questionElement.classList.remove('unanswered');
                }}
            }}
            
            if (!allAnswered) {{
                alert("All questions need to be answered before submission!");
                return;
            }}
            
            calculateScore();
            window.scrollTo({{ top: 0, behavior: 'smooth' }});
        }}
        
        function calculateScore() {{
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.classList.add('hidden');
            
            let score = 0;
            let form = document.getElementById('quizForm');
            
            for (let i = 0; i < {len(questions)}; i++) {{
                const selected = form.elements[`q${{i}}`].value;
                const explanation = document.getElementById(`explanation${{i}}`);
                const questionText = document.getElementById(`questionText${{i}}`);
                
                for (let j = 0; j < {max_options}; j++) {{
                    const feedback = document.getElementById(`feedback${{i}}-${{j}}`);
                    if (j == correctAnswers[i]) {{
                        feedback.textContent = "(Correct!)";
                        feedback.classList.add("correct-feedback");
                        feedback.style.display = "inline";
                    }}
                    if (selected == j && j != correctAnswers[i]) {{
                        feedback.textContent = "(Wrong...)";
                        feedback.classList.add("incorrect-feedback");
                        feedback.style.display = "inline";
                    }}
                }}
                
                if (selected == correctAnswers[i]) {{
                    score++;
                    questionText.classList.add('correct');
                }} else {{
                    questionText.classList.add('incorrect');
                }}
                
                explanation.style.display = 'block';
            }}
            
            let resultLevel = 'Vocababy';  // Default if no threshold is met

            // Sort thresholds in descending order and assign first matching
            const sortedLevels = Object.entries(resultLevels).sort((a, b) => b[1] - a[1]);
            for (const [level, threshold] of sortedLevels) {{
                if (score >= threshold) {{
                    resultLevel = level;
                    break;
                }}
            }}

            
            const resultText = `${{resultLevel}} (${{score}} / {len(questions)})`;
            document.getElementById('result').textContent = resultText;
            
            const img = document.createElement('img');
            img.src = resultImages[resultLevel];
            img.alt = resultText;
            img.className = 'result-img';
            img.title = 'Share my score: ' + resultText;
            document.getElementById('resultImg').appendChild(img);

            const para = document.createElement('p');
            para.textContent = resultParagraphs[resultLevel] || "";
            document.getElementById('resultParagraph').appendChild(para);
        }}
    </script>
</body>
</html>
    """

    with open(output_file, 'w') as f:
        f.write(html_template)
    print(f"Quiz generated successfully! Saved as {output_file}")


# Input the questions here
if __name__ == "__main__":
    questions = [
        {
            "question": "What is the capital of France?",
            "options": ["Paris", "Barcelona", "Wrong answer"],
            "correct": 0,
            "explanation": "Paris is the capital of France because... It just is, okay?"
        }
    ]

#And the results here
    result_levels = {
        "Trivia Pro": 10,
        "Wow you exist!": 6,
        "Brainlet": 4
    }

    generate_quiz(questions, result_levels)
