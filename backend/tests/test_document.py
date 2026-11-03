import os
import sys
import unittest
from pathlib import Path

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.testclient import TestClient
from routers.document import router as document_router

test_app = FastAPI()
test_app.include_router(document_router)
client = TestClient(test_app)


class TestDocumentEndpoint(unittest.TestCase):

    def test_invalid_doc_id_traversal(self):
        # Security test: directory traversal attempt
        response = client.get("/document/..%2F..%2F/page/1")
        self.assertIn(response.status_code, [400, 404])

    def test_invalid_doc_id_format(self):
        # Too short (not 8 characters)
        res1 = client.get("/document/abc/page/1")
        self.assertEqual(res1.status_code, 400)
        self.assertIn("Invalid document ID format", res1.json()["detail"])

        # Contains invalid characters (e.g., underscore)
        res2 = client.get("/document/1234_abc/page/1")
        self.assertEqual(res2.status_code, 400)
        self.assertIn("Invalid document ID format", res2.json()["detail"])

        # Too long
        res3 = client.get("/document/1234567890/page/1")
        self.assertEqual(res3.status_code, 400)
        self.assertIn("Invalid document ID format", res3.json()["detail"])

    def test_nonexistent_doc_id(self):
        response = client.get("/document/nonexist/page/1")
        self.assertEqual(response.status_code, 404)
        self.assertIn("Document not found", response.json()["detail"])

    def test_overlong_q(self):
        doc_id = "1eca38c6"
        overlong_q = "a" * 501
        response = client.get(f"/document/{doc_id}/page/1?q={overlong_q}")
        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeds maximum allowed length", response.json()["detail"])

    def test_page_num_zero_and_negative(self):
        doc_id = "1eca38c6"
        res_zero = client.get(f"/document/{doc_id}/page/0")
        self.assertEqual(res_zero.status_code, 404)

        res_neg = client.get(f"/document/{doc_id}/page/-1")
        self.assertEqual(res_neg.status_code, 404)

    def test_page_num_beyond_count(self):
        doc_id = "1eca38c6"
        response = client.get(f"/document/{doc_id}/page/99999")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_valid_page_rendering_with_matching_q(self):
        doc_id = "1eca38c6"
        q = "terms and conditions under which a property is to be rented"
        response = client.get(f"/document/{doc_id}/page/1?q={q}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("content-type"), "image/png")
        self.assertEqual(response.headers.get("cache-control"), "private, max-age=300")
        # Verify PNG magic bytes
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertGreater(len(response.content), 1000)

    def test_valid_page_rendering_with_nonmatching_q(self):
        doc_id = "1eca38c6"
        q = "this phrase definitely does not appear anywhere on page one xyz123"
        response = client.get(f"/document/{doc_id}/page/1?q={q}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("content-type"), "image/png")
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_valid_page_rendering_without_q(self):
        doc_id = "1eca38c6"
        response = client.get(f"/document/{doc_id}/page/1")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("content-type"), "image/png")
        self.assertTrue(response.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_zoom_clamping(self):
        doc_id = "1eca38c6"
        # Test zoom clamped to 1.0 (min) and 3.0 (max)
        res_min = client.get(f"/document/{doc_id}/page/1?zoom=0.1")
        self.assertEqual(res_min.status_code, 200)

        res_max = client.get(f"/document/{doc_id}/page/1?zoom=10.0")
        self.assertEqual(res_max.status_code, 200)

    def test_delete_document_invalid_format(self):
        res = client.delete("/document/invalid_id")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid document ID format", res.json()["detail"])

    def test_delete_document_success(self):
        # Create a dummy file in uploaded_docs
        upload_dir = Path(backend_dir) / "uploaded_docs"
        upload_dir.mkdir(parents=True, exist_ok=True)
        dummy_doc_id = "deltest1"
        dummy_file = upload_dir / f"{dummy_doc_id}_sample.pdf"
        dummy_brief = upload_dir / f"{dummy_doc_id}_brief.json"
        dummy_file.write_text("dummy pdf content", encoding="utf-8")
        dummy_brief.write_text("{}", encoding="utf-8")

        self.assertTrue(dummy_file.exists())
        self.assertTrue(dummy_brief.exists())

        res = client.delete(f"/document/{dummy_doc_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["deleted"])
        self.assertEqual(data["doc_id"], dummy_doc_id)
        self.assertIn(f"{dummy_doc_id}_sample.pdf", data["files_removed"])
        self.assertIn(f"{dummy_doc_id}_brief.json", data["files_removed"])

        self.assertFalse(dummy_file.exists())
        self.assertFalse(dummy_brief.exists())


if __name__ == "__main__":
    unittest.main()
