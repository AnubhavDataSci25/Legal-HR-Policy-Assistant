"""
Unit and integration tests for Document Brief feature.
Tests:
1. Chunk selection logic (bounded, keyword-aware, page-preserving)
2. JSON parsing and schema normalization with fallback handling
3. FastAPI endpoints: POST and GET /documents/{document_id}/brief (including 404 for non-existent documents)
"""

import os
import sys
import unittest

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from generation.generator import select_brief_chunks, _parse_brief_json
from main import app

client = TestClient(app)


class TestDocumentBrief(unittest.TestCase):

    def test_select_brief_chunks_empty(self):
        chunks = []
        selected = select_brief_chunks(chunks, max_chunks=10)
        self.assertEqual(selected, [])

    def test_select_brief_chunks_small_list(self):
        chunks = [
            {"text": "Introduction chunk", "page": 1, "chunk_id": 0},
            {"text": "Body chunk", "page": 2, "chunk_id": 1},
        ]
        selected = select_brief_chunks(chunks, max_chunks=10)
        self.assertEqual(len(selected), 2)
        self.assertEqual(selected[0]["page"], 1)
        self.assertEqual(selected[1]["page"], 2)

    def test_select_brief_chunks_bounded_and_prioritized(self):
        # Create 50 dummy chunks
        chunks = []
        for i in range(50):
            text = f"Generic text on page {i // 5 + 1} with no keywords."
            if i == 15:
                text = "Termination notice period is 30 days and fee is $5,000."
            elif i == 30:
                text = "Employee responsibilities and obligations shall include confidentiality."
            chunks.append({"text": text, "page": i // 5 + 1, "chunk_id": i})

        max_allowed = 12
        selected = select_brief_chunks(chunks, max_chunks=max_allowed)
        self.assertLessEqual(len(selected), max_allowed)

        # Verify first chunks are included (head)
        self.assertTrue(any(c["chunk_id"] == 0 for c in selected))
        # Verify last chunks are included (tail)
        self.assertTrue(any(c["chunk_id"] == 49 for c in selected))
        # Verify keyword-rich chunk is selected
        self.assertTrue(any("Termination" in c["text"] for c in selected))

    def test_parse_brief_json_clean(self):
        raw = '''{
            "summary": "This is a test policy document.",
            "key_clauses": [{"title": "Termination", "description": "30 days notice", "page": 2, "source_excerpt": "30 days"}],
            "dates_and_deadlines": [{"item": "Effective date", "value": "January 1, 2026", "context": "Start date", "page": 1}],
            "amounts_and_financial_terms": [{"item": "Penalty", "value": "$500", "context": "Late fee", "page": 3}],
            "obligations": [{"party": "Employee", "obligation": "Report incidents", "page": 2}],
            "risks_and_conditions": [{"item": "Default", "condition": "Account suspension", "page": 4}],
            "unspecified_information": [{"item": "Governing law", "description": "No jurisdiction specified"}]
        }'''
        parsed = _parse_brief_json(raw)
        self.assertEqual(parsed.get("summary"), "This is a test policy document.")
        self.assertEqual(len(parsed.get("key_clauses", [])), 1)
        self.assertEqual(parsed["key_clauses"][0]["title"], "Termination")
        self.assertEqual(len(parsed.get("dates_and_deadlines", [])), 1)
        self.assertEqual(len(parsed.get("amounts_and_financial_terms", [])), 1)
        self.assertEqual(len(parsed.get("obligations", [])), 1)
        self.assertEqual(len(parsed.get("risks_and_conditions", [])), 1)
        self.assertEqual(len(parsed.get("unspecified_information", [])), 1)

    def test_parse_brief_json_with_markdown_fences_and_extra_text(self):
        raw = '''Here is the analysis you requested:
        ```json
        {
            "summary": "Document overview.",
            "key_clauses": [{"title": "Scope", "description": "Applicable rules"}]
        }
        ```
        Hope this helps!'''
        parsed = _parse_brief_json(raw)
        self.assertEqual(parsed.get("summary"), "Document overview.")
        self.assertEqual(len(parsed.get("key_clauses", [])), 1)

    def test_parse_brief_json_malformed_fallback(self):
        raw = "This is not valid JSON at all!"
        parsed = _parse_brief_json(raw)
        self.assertIsInstance(parsed, dict)
        self.assertEqual(parsed, {})

    def test_api_endpoint_404_for_unknown_document(self):
        response = client.post("/documents/non-existent-doc-id-99999/brief")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

        get_response = client.get("/documents/non-existent-doc-id-99999/brief")
        self.assertEqual(get_response.status_code, 404)

    def test_api_endpoint_cached_document(self):
        doc_id = "1eca38c6"
        cache_path = os.path.join(backend_dir, "uploaded_docs", f"{doc_id}_brief.json")
        if os.path.exists(cache_path):
            response = client.get(f"/documents/{doc_id}/brief")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertEqual(data["document_id"], doc_id)
            self.assertEqual(data["status"], "completed")
            self.assertTrue(len(data["summary"]) > 0)
            self.assertIn("key_clauses", data)
            self.assertIn("dates_and_deadlines", data)
            self.assertIn("amounts_and_financial_terms", data)
            self.assertIn("obligations", data)
            self.assertIn("risks_and_conditions", data)
            self.assertIn("unspecified_information", data)
            self.assertIn("generated_at", data)


if __name__ == "__main__":
    unittest.main()
