"""
Unit tests for Saiph AI Agent tools, search integration, and branch diffing.
"""
import unittest
from unittest.mock import patch, MagicMock

import Saiph.tools as st
from Saiph.tools import search_zimbabwe_web_tool, diff_article_branches, ALL_AGENT_TOOLS


class SaiphToolsTestCase(unittest.TestCase):
    """Test suite for Saiph LangGraph tools."""

    def test_search_zimbabwe_web_tool_is_registered(self):
        """Verifies search_zimbabwe_web_tool is properly registered in ALL_AGENT_TOOLS."""
        tool_names = [getattr(t, "name", getattr(t, "__name__", None)) for t in ALL_AGENT_TOOLS]
        self.assertIn("search_zimbabwe_web_tool", tool_names)

    def test_diff_article_branches_is_registered(self):
        """Verifies diff_article_branches tool is properly registered in ALL_AGENT_TOOLS."""
        tool_names = [getattr(t, "name", getattr(t, "__name__", None)) for t in ALL_AGENT_TOOLS]
        self.assertIn("diff_article_branches", tool_names)

    def test_search_tool_missing_api_key(self):
        """When TAVILY_API_KEY is not set, returns a clear configuration error message."""
        with patch.object(st, "TAVILY_API_KEY", ""):
            result = search_zimbabwe_web_tool.invoke({"query": "Harare health budget"})
            self.assertEqual(result, "Tavily web search API key is not configured.")

    @patch("Saiph.tools.TavilyClient")
    def test_search_tool_successful_execution(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool calls Tavily API and formats results."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client

        mock_client.search.return_value = {
            "results": [
                {
                    "title": "Harare Water Crisis Deepens",
                    "url": "https://example.co.zw/news/1",
                    "published_date": "2026-11-04",
                    "content": "City council reports low dam levels at Lake Chivero.",
                }
            ]
        }

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "water shortages"})
            
            # Must append Zimbabwe to generic queries
            mock_client_class.assert_called_once_with(api_key="tvly-mock-test-key")
            mock_client.search.assert_called_once_with(
                query="water shortages Zimbabwe",
                search_depth="basic",
                max_results=5,
                include_answer=False,
            )
            
            self.assertIn("Harare Water Crisis Deepens", result)
            self.assertIn("https://example.co.zw/news/1", result)
            self.assertIn("City council reports low dam levels", result)

    @patch("Saiph.tools.TavilyClient")
    def test_search_tool_keeps_existing_zimbabwe_anchor(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool does not duplicate Zimbabwe if an anchor city exists."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.search.return_value = {"results": []}

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "Zimbabwe industrial zone"})
            mock_client.search.assert_called_once_with(
                query="Zimbabwe industrial zone",
                search_depth="basic",
                max_results=5,
                include_answer=False,
            )
            self.assertIn("No verified web results found in Zimbabwe", result)

    @patch("Saiph.tools.TavilyClient")
    def test_search_tool_handles_network_exception(self, mock_client_class):
        """Verifies search_zimbabwe_web_tool catches network exceptions and does not crash."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.search.side_effect = RuntimeError("Connection timed out")

        with patch.object(st, "TAVILY_API_KEY", "tvly-mock-test-key"):
            result = search_zimbabwe_web_tool.invoke({"query": "Zimbabwe inflation rate"})
            self.assertIn("Web search request failed: Connection timed out", result)

    @patch("httpx.Client")
    def test_diff_article_branches_tool_success(self, mock_client_class):
        """Verifies diff_article_branches compares two branches and outputs unified diff and stats."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "article_id": "art-1",
            "title": "Harare Water Crisis",
            "branches": [
                {
                    "branch_name": "main",
                    "content": "Line 1: Council reports dam shortage.\nLine 2: Rationing begins.",
                    "is_main": True,
                },
                {
                    "branch_name": "draft-v2",
                    "content": "Line 1: Council reports dam shortage.\nLine 2: Rationing begins.\nLine 3: 50 new boreholes drilled.",
                    "is_main": False,
                },
            ]
        }
        mock_client.get.return_value = mock_response

        res = diff_article_branches.invoke({
            "article_id": "art-1",
            "branch_a": "draft-v2",
            "branch_b": "main",
        })

        self.assertIn("Diff: 'draft-v2' vs 'main'", res)
        self.assertIn("Similarity:", res)
        self.assertIn("Additions: +1 lines", res)
        self.assertIn("Deletions: -0 lines", res)
        self.assertIn("+Line 3: 50 new boreholes drilled.", res)

    @patch("httpx.Client")
    def test_diff_article_branches_defaults_to_main(self, mock_client_class):
        """When branch_b is omitted, diff tool compares branch_a against 'main'."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "article_id": "art-1",
            "branches": [
                {"branch_name": "main", "content": "Original draft", "is_main": True},
                {"branch_name": "investigative", "content": "Original draft with extra lead", "is_main": False},
            ]
        }
        mock_client.get.return_value = mock_response

        res = diff_article_branches.invoke({
            "article_id": "art-1",
            "branch_a": "investigative",
        })

        self.assertIn("Diff: 'investigative' vs 'main'", res)
        self.assertIn("Similarity:", res)

    @patch("httpx.Client")
    def test_diff_article_branches_not_found(self, mock_client_class):
        """When a requested branch does not exist, returns helpful error with list of available branches."""
        mock_client = MagicMock()
        mock_client_class.return_value.__enter__.return_value = mock_client

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "article_id": "art-1",
            "branches": [{"branch_name": "main"}, {"branch_name": "draft-v2"}],
        }
        mock_client.get.return_value = mock_response

        res = diff_article_branches.invoke({
            "article_id": "art-1",
            "branch_a": "ghost-branch",
        })
        self.assertIn("Branch 'ghost-branch' not found", res)
        self.assertIn("Available branches: main, draft-v2", res)


if __name__ == "__main__":
    unittest.main()
