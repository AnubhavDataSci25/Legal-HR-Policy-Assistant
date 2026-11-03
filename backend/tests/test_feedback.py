import os
import sys
import tempfile
import unittest
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers.feedback import router as feedback_router

test_app = FastAPI()
test_app.include_router(feedback_router)
client = TestClient(test_app)


class TestFeedbackEndpoints(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_feedback.db"
        os.environ["FEEDBACK_DB_PATH"] = str(self.db_path)

    def tearDown(self):
        os.environ.pop("FEEDBACK_DB_PATH", None)
        self.temp_dir.cleanup()

    def test_empty_summary(self):
        res = client.get("/feedback/summary")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"total": 0, "up": 0, "down": 0})

    def test_submit_thumbs_up(self):
        payload = {
            "doc_id": "testdoc1",
            "question": "What is the notice period?",
            "answer": "The notice period is 30 days.",
            "rating": "up",
            "comment": None,
            "pages": [1, 2],
        }
        res = client.post("/feedback", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

        summary = client.get("/feedback/summary")
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.json(), {"total": 1, "up": 1, "down": 0})

    def test_submit_thumbs_down_with_comment(self):
        payload = {
            "doc_id": "testdoc1",
            "question": "What is the probation period?",
            "answer": "Probation is 3 months.",
            "rating": "down",
            "comment": "Missed the clause about extension.",
            "pages": [3],
        }
        res = client.post("/feedback", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

        summary = client.get("/feedback/summary?doc_id=testdoc1")
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.json(), {"total": 1, "up": 0, "down": 1})

    def test_summary_filtering_by_doc_id(self):
        client.post(
            "/feedback",
            json={
                "doc_id": "doc_alpha",
                "question": "Q1",
                "answer": "A1",
                "rating": "up",
                "pages": [],
            },
        )
        client.post(
            "/feedback",
            json={
                "doc_id": "doc_alpha",
                "question": "Q2",
                "answer": "A2",
                "rating": "up",
                "pages": [1],
            },
        )
        client.post(
            "/feedback",
            json={
                "doc_id": "doc_beta",
                "question": "Q3",
                "answer": "A3",
                "rating": "down",
                "comment": "Incorrect",
                "pages": [2],
            },
        )

        overall = client.get("/feedback/summary").json()
        self.assertEqual(overall, {"total": 3, "up": 2, "down": 1})

        doc_alpha = client.get("/feedback/summary?doc_id=doc_alpha").json()
        self.assertEqual(doc_alpha, {"total": 2, "up": 2, "down": 0})

        doc_beta = client.get("/feedback/summary?doc_id=doc_beta").json()
        self.assertEqual(doc_beta, {"total": 1, "up": 0, "down": 1})

        doc_empty = client.get("/feedback/summary?doc_id=doc_nonexistent").json()
        self.assertEqual(doc_empty, {"total": 0, "up": 0, "down": 0})

    def test_validation_errors(self):
        # Invalid rating
        res1 = client.post(
            "/feedback",
            json={
                "doc_id": "doc1",
                "question": "Q",
                "answer": "A",
                "rating": "neutral",
            },
        )
        self.assertEqual(res1.status_code, 422)

        # Empty question
        res2 = client.post(
            "/feedback",
            json={
                "doc_id": "doc1",
                "question": "",
                "answer": "A",
                "rating": "up",
            },
        )
        self.assertEqual(res2.status_code, 422)

        # Question too long (>1000)
        res3 = client.post(
            "/feedback",
            json={
                "doc_id": "doc1",
                "question": "a" * 1001,
                "answer": "A",
                "rating": "up",
            },
        )
        self.assertEqual(res3.status_code, 422)

        # Answer too long (>4000)
        res4 = client.post(
            "/feedback",
            json={
                "doc_id": "doc1",
                "question": "Q",
                "answer": "a" * 4001,
                "rating": "up",
            },
        )
        self.assertEqual(res4.status_code, 422)

        # Comment too long (>500)
        res5 = client.post(
            "/feedback",
            json={
                "doc_id": "doc1",
                "question": "Q",
                "answer": "A",
                "rating": "down",
                "comment": "c" * 501,
            },
        )
        self.assertEqual(res5.status_code, 422)


if __name__ == "__main__":
    unittest.main()
