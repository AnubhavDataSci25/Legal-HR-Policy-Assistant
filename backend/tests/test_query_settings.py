import os
import sys
import unittest

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from routers.query import QueryRequest


class TestQuerySettingsValidation(unittest.TestCase):
    def test_default_values(self):
        req = QueryRequest(doc_id="test1234", question="What is policy?")
        self.assertEqual(req.answer_style, "concise")
        self.assertEqual(req.top_n, 5)

    def test_valid_custom_values(self):
        req = QueryRequest(
            doc_id="test1234",
            question="What is policy?",
            answer_style="detailed",
            top_n=3,
        )
        self.assertEqual(req.answer_style, "detailed")
        self.assertEqual(req.top_n, 3)

        req7 = QueryRequest(
            doc_id="test1234",
            question="What is policy?",
            answer_style="concise",
            top_n=7,
        )
        self.assertEqual(req7.top_n, 7)

    def test_invalid_values(self):
        # top_n below 3
        with self.assertRaises(ValueError):
            QueryRequest(doc_id="test1234", question="Q", top_n=2)

        # top_n above 7
        with self.assertRaises(ValueError):
            QueryRequest(doc_id="test1234", question="Q", top_n=8)

        # invalid answer_style
        with self.assertRaises(ValueError):
            QueryRequest(doc_id="test1234", question="Q", answer_style="verbose")


if __name__ == "__main__":
    unittest.main()
