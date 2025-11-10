import os
import re
import json
import time 
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables (from .env file)
load_dotenv()

# --- Configuration ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

try:
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
except KeyError:
    raise EnvironmentError("GEMINI_API_KEY not found in environment variables.")

# --- Caching Setup ---
# The simple cache has been REMOVED.
# Caching with chat history is complex and requires a different approach.

# --- System Instruction (Unchanged) ---
SYSTEM_INSTRUCTION = """You are Synapse, a friendly and helpful AI assistant specializing in finding tickets and products.
Your goal is to provide accurate, specific, and actionable information.
... (Your full system instruction remains here) ...
"""

# --- Helper Function to Parse Model Response (Unchanged) ---
def parse_json_from_text(text):
    """Extracts the first ```json ... ``` block from text."""
    match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
    if match:
        json_string = match.group(1)
        try:
            return json.loads(json_string), text.replace(match.group(0), '').strip()
        except json.JSONDecodeError:
            print(f"Warning: Failed to parse JSON: {json_string}")
            return None, text
    return None, text

# --- API Endpoints ---
@app.route('/api/chat', methods=['POST'])
def chat_handler():
    """
    Handles chat requests, including optional image uploads.
    This endpoint now uses the provided chat history for memory.
    """
    try:
        data = request.json
        prompt = data.get('prompt', 'Describe this image and find relevant products.')
        file = data.get('file')
        # --- NEW: Get the chat history from the frontend ---
        history = data.get('history', [])

        chat_model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            system_instruction=SYSTEM_INSTRUCTION
        )

        # --- NEW: Build the API history from the frontend history ---
        api_history = []
        for message in history:
            # The 'role' from frontend (user/model) matches the API
            api_history.append({
                'role': message['role'],
                'parts': [message['content']]
            })
            
        # --- NEW: Construct the final message from the user ---
        new_message_parts = []
        if file and file.get('data'):
            new_message_parts.append({
                "inline_data": {
                    "mime_type": file.get('mimeType', 'image/jpeg'),
                    "data": file.get('data')
                }
            })
        new_message_parts.append({"text": prompt})
        
        # Add the user's *new* message to the end of the history
        api_history.append({'role': 'user', 'parts': new_message_parts})

        # --- NEW: Send the *entire history* to Gemini ---
        response = chat_model.generate_content(api_history)

        # Extract sources (Unchanged)
        sources = []
        if response.candidates and response.candidates[0].grounding_metadata:
            sources = [
                chunk.web.to_dict() 
                for chunk in response.candidates[0].grounding_metadata.grounding_chunks
                if hasattr(chunk, 'web') and chunk.web is not None
            ]
        
        # Parse JSON and conversational text (Unchanged)
        parsed_json, conversational_text = parse_json_from_text(response.text)
        products = parsed_json.get('products', []) if parsed_json else []
        suggestions = parsed_json.get('suggestions', []) if parsed_json else []
        comparison_table = parsed_json.get('comparison_table', []) if parsed_json else []

        # Create the response data object (Unchanged)
        response_data = {
            "text": conversational_text,
            "sources": sources,
            "products": products,
            "suggestions": suggestions,
            "comparison_table": comparison_table
        }
        
        # No caching - just return the response
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/edit-image', methods=['POST'])
def edit_image_handler():
    """
    Handles virtual try-on image editing requests.
    (This function is unchanged)
    """
    # ... (This entire function remains the same) ...
    try:
        data = request.json
        prompt = data.get('prompt')
        image_data = data.get('imageData')
        mime_type = data.get('mimeType')

        if not all([prompt, image_data, mime_type]):
            return jsonify({"error": "Missing required fields"}), 400

        image_model = genai.GenerativeModel('gemini-2.5-flash-image')

        image_part = {"inline_data": {"data": image_data, "mime_type": mime_type}}
        text_part = {"text": prompt}

        response = image_model.generate_content(
            [image_part, text_part],
            generation_config={"response_modalities": ["IMAGE"]}
        )

        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    return jsonify({"imageData": part.inline_data.data})

        raise Exception("No image was generated by the model.")

    except Exception as e:
        print(f"Error in /api/edit-image: {e}")
        return jsonify({"error": str(e)}), 500

# --- Run the Server ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)