import unittest

from ai_service_import import detection


class DetectionTests(unittest.TestCase):
    def test_safe_known_url_scores_low(self):
        result = detection.analyze_url("https://github.com/openai", perform_dns=False)
        self.assertLessEqual(result["risk_score"], 30)
        self.assertEqual(result["risk_level"], "SAFE")

    def test_phishing_url_scores_high(self):
        result = detection.analyze_url("http://paypa1-secure.login-verify.com/account/update?login=verify", perform_dns=False)
        self.assertGreaterEqual(result["risk_score"], 66)
        self.assertEqual(result["risk_level"], "PHISHING")
        self.assertGreaterEqual(len(result["metadata"]["features"]), 15)

    def test_invalid_url_rejected(self):
        with self.assertRaises(ValueError):
            detection.analyze_url("not-a-url", perform_dns=False)

    def test_email_links_are_analysed(self):
        raw = """From: PayPal Security <notice@random-login.example>
Subject: URGENT verify your account
Authentication-Results: spf=fail dkim=fail dmarc=fail

Your account is suspended. Verify immediately:
http://paypa1-secure.login-verify.com/account
"""
        result = detection.analyze_email(raw, perform_dns=False)
        self.assertEqual(result["risk_level"], "PHISHING")
        self.assertGreater(result["metadata"]["link_count"], 0)
        self.assertIn("recommended_action", result)


if __name__ == "__main__":
    unittest.main()
