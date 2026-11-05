"""
Unit tests for Saiph AI Agent tools and search integration.
"""
import unittest
from unittest.mock import patch, MagicMock

import Saiph.tools as st
from Saiph.tools import search_zimbabwe_web_tool, ALL_AGENT_TOOLS


class SaiphToolsTestCase(unittest.TestCase):
    """Test suite for Saiph LangGraph tools."""

    def test_search_zimbabwe_web_tool_is_registered(self):
        """Verifies search_zimbabwe_web_tool is properly registered in ALL_AGENT_TOOLS."""
        tool_names = [getattr(t, "name", getattr(t, "__name__", None)) for t in ALL_AGENT_TOOLS]
        self.assertIn("search_zimbabwe_web_tool", tool_names)

    def test_search_tool_missing_api_key(self):
        """When TAVILY_API_KEY is not set, returns a clear configuration error message."""
        with patch.object(st, "TAVILY_API_KEY", ""):
            result = search_zimbabwe_web_tool.invoke({"query": "Harare health budget"})
            self.assertEqual(result, "Tavily web search API key is not configured.")

    @patch("httpx.Client")
    def test_search_tool_successful_execution(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool calls Tavily API and formats results."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {
                    "title": "Harare Water Crisis Deepens",
                    "url": "https://example.co.zw/news/1",
                    "published_date": "2026-11-04",
                    "content": "City council reports low dam levels at Lake Chivero.",
                }
            ]
        }
        mock_client.post.return_value = mock_response

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "water shortages"})
            
            # Must append Zimbabwe to generic queries
            mock_client.post.assert_called_once()
            called_payload = mock_client.post.call_args[1]["json"]
            self.assertEqual(called_payload["query"], "water shortages Zimbabwe")
            
            self.assertIn("Harare Water Crisis Deepens", result)
            self.assertIn("https://example.co.zw/news/1", result)
            self.assertIn("City council reports low dam levels", result)

    @patch("httpx.Client")
    def test_search_tool_keeps_existing_zimbabwe_anchor(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool does not duplicate Zimbabwe if an anchor city exists."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"results": []}
        mock_client.post.return_value = mock_response

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "Bulawayo industrial zone"})
            called_payload = mock_client.post.call_args[1]["json"]
            self.assertEqual(called_payload["query"], "Bulawayo industrial zone")
            self.assertIn("No verified web results found in Zimbabwe", result)

    @patch("httpx.Client")
    def test_search_tool_handles_http_error(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool gracefully returns API error responses."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized: Invalid API key"
        mock_client.post.return_value = mock_response

        with patch.object(st, "TAVILY_API_KEY", "tvly-invalid-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "ZESA tariffs Zimbabwe"})
            self.assertIn("Search error (401)", result)

    @patch("httpx.Client")
    def test_search_tool_handles_network_exception(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool catches network exceptions and does not crash."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client
        mock_client.post.side_effect = RuntimeError("Connection timed out")

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "Zimbabwe inflation rate"})
            self.assertIn("Web search request failed: Connection timed out", result)


if __name__ == "__main__":
    unittest.main()

