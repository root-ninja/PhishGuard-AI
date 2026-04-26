from __future__ import annotations

import base64
import hashlib
import html.parser
import ipaddress
import re
import socket
from dataclasses import dataclass
from datetime import datetime, timezone
from email import policy
from email.parser import BytesParser, Parser
from typing import Any
from urllib.parse import parse_qs, urlparse


URGENT_WORDS = {
    "urgent",
    "immediately",
    "suspended",
    "verify",
    "confirm",
    "alert",
    "warning",
    "account",
    "expire",
    "limited",
    "action required",
    "click here",
    "update",
    "validate",
    "blocked",
    "unusual",
    "security",
    "compromised",
}

BRANDS = {
    "paypal": "paypal.com",
    "google": "google.com",
    "microsoft": "microsoft.com",
    "apple": "apple.com",
    "amazon": "amazon.com",
    "facebook": "facebook.com",
    "netflix": "netflix.com",
    "github": "github.com",
}

SCAM_TOKENS = {
    "paypa1",
    "paypa-l",
    "g00gle",
    "arnazon",
    "micros0ft",
    "faceb00k",
    "netfl1x",
    "app1e",
    "secure-login",
    "account-verify",
    "login-secure",
    "banking-alert",
    "update-required",
}

SUSPICIOUS_TLDS = {".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".work", ".click", ".link", ".top", ".icu"}
SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "ow.ly", "cutt.ly", "rebrand.ly"}


class LinkExtractor(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        for name, value in attrs:
            if name.lower() == "href" and value:
                self.links.append(value)


@dataclass
class Indicator:
    title: str
    desc: str
    level: str
    source: str = "heuristic"
    icon: str = "!"

    def as_dict(self) -> dict[str, str]:
        return {
            "title": self.title,
            "desc": self.desc,
            "level": self.level,
            "source": self.source,
            "icon": self.icon,
        }


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha_id(prefix: str, value: str) -> str:
    digest = hashlib.sha256((value + now_iso()).encode("utf-8")).hexdigest()[:16]
    return f"{prefix}_{digest}"


def risk_level(score: int) -> str:
    if score <= 30:
        return "SAFE"
    if score <= 65:
        return "SUSPICIOUS"
    return "PHISHING"


def recommended_action(level: str) -> str:
    if level == "PHISHING":
        return "Do not open links, do not enter credentials, report to security, and quarantine the message or URL."
    if level == "SUSPICIOUS":
        return "Verify the sender or domain through a trusted channel before clicking links or sharing information."
    return "No immediate action is required. Continue normal caution and keep the report for audit history."


def normalize_url(raw_url: str) -> str:
    value = (raw_url or "").strip()
    if not value:
        raise ValueError("URL is required.")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Enter a valid http or https URL.")
    return value


def hostname_for(url: str) -> str:
    return (urlparse(url).hostname or "").lower().strip(".")


def is_ip_host(hostname: str) -> bool:
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        return False


def subdomain_depth(hostname: str) -> int:
    parts = [p for p in hostname.split(".") if p]
    return max(len(parts) - 2, 0)


def has_dns(hostname: str) -> bool:
    if not hostname or is_ip_host(hostname):
        return False
    try:
        socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        return True
    except OSError:
        return False


def brand_similarity(hostname: str) -> tuple[bool, str]:
    compact = hostname.replace("-", "").replace(".", "")
    for brand, domain in BRANDS.items():
        if hostname.endswith(domain):
            continue
        suspicious_spellings = {
            brand.replace("o", "0"),
            brand.replace("l", "1"),
            brand.replace("a", "@"),
            brand + "secure",
            brand + "login",
            brand + "verify",
        }
        if brand in compact or compact in suspicious_spellings or any(token in compact for token in suspicious_spellings):
            return True, brand
    return False, ""


def extract_url_features(url: str) -> dict[str, Any]:
    parsed = urlparse(url)
    hostname = hostname_for(url)
    path = parsed.path or ""
    query = parsed.query or ""
    special_chars = sum(url.count(ch) for ch in ["@", "%", "!", "#", "$", "~"])
    depth = subdomain_depth(hostname)
    brand_hit, brand = brand_similarity(hostname)
    query_values = parse_qs(query)

    return {
        "url_length": len(url),
        "host_length": len(hostname),
        "uses_ip_address": is_ip_host(hostname),
        "has_https": parsed.scheme == "https",
        "special_char_count": special_chars,
        "subdomain_depth": depth,
        "path_depth": len([p for p in path.split("/") if p]),
        "query_param_count": len(query_values),
        "has_at_symbol": "@" in url,
        "has_double_slash_redirect": "//" in path,
        "has_punycode": "xn--" in hostname,
        "suspicious_tld": any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS),
        "shortener_domain": hostname in SHORTENERS,
        "brand_similarity": brand_hit,
        "brand_target": brand,
        "sensitive_keyword_count": len(
            [k for k in ["login", "secure", "verify", "account", "update", "confirm", "banking", "password"] if k in url.lower()]
        ),
    }


def analyze_url(
    raw_url: str,
    blacklist: set[str] | None = None,
    whitelist: set[str] | None = None,
    perform_dns: bool = True,
) -> dict[str, Any]:
    url = normalize_url(raw_url)
    hostname = hostname_for(url)
    blacklist = blacklist or set()
    whitelist = whitelist or set()
    indicators: list[Indicator] = []
    score = 0

    if hostname in whitelist:
        indicators.append(Indicator("Whitelisted Domain", f"{hostname} is on the local whitelist.", "safe", "admin", "OK"))
        return build_result("URL", url, 5, indicators, {"features": extract_url_features(url), "dns": {"has_a_record": True}})

    if hostname in blacklist:
        score += 85
        indicators.append(Indicator("Blacklisted Domain", f"{hostname} is on the local blacklist.", "danger", "admin", "!"))

    features = extract_url_features(url)

    checks = [
        (features["uses_ip_address"], 30, "IP Address Used", "URL uses a raw IP address instead of a domain name.", "danger"),
        (features["url_length"] > 75, 12, "Unusually Long URL", f"URL length is {features['url_length']} characters.", "warn"),
        (features["special_char_count"] > 2, 10, "Obfuscated Characters", f"Found {features['special_char_count']} high-risk special characters.", "warn"),
        (not features["has_https"], 15, "No HTTPS", "URL uses HTTP instead of HTTPS.", "warn"),
        (features["subdomain_depth"] >= 3, 12, "Deep Subdomain Chain", f"Subdomain depth is {features['subdomain_depth']}.", "warn"),
        (features["suspicious_tld"], 16, "Suspicious TLD", "Top-level domain is commonly abused for phishing.", "warn"),
        (features["shortener_domain"], 14, "URL Shortener", "Shortened links hide the final destination.", "warn"),
        (features["brand_similarity"], 35, "Brand Impersonation", f"Domain appears to imitate {features['brand_target']}.", "danger"),
        (features["sensitive_keyword_count"] >= 2, 18, "Sensitive Keywords", "URL contains multiple account or login keywords.", "warn"),
        (features["has_at_symbol"], 12, "At-Sign Redirect Pattern", "URL contains @, which can hide the real host.", "warn"),
        (features["has_punycode"], 20, "Punycode Hostname", "Hostname contains punycode, often used for lookalike domains.", "danger"),
    ]

    for passed, points, title, desc, level in checks:
        if passed:
            score += points
            indicators.append(Indicator(title, desc, level))

    scam_token = next((token for token in SCAM_TOKENS if token in url.lower()), "")
    if scam_token:
        score += 28
        indicators.append(Indicator("Known Phishing Token", f"Matched high-risk token: {scam_token}.", "danger", "rules"))

    dns_info = {"checked": perform_dns, "has_a_record": None}
    if perform_dns:
        dns_ok = has_dns(hostname)
        dns_info["has_a_record"] = dns_ok
        if not dns_ok and not features["uses_ip_address"]:
            score += 18
            indicators.append(Indicator("DNS Resolution Failed", "Domain could not be resolved through DNS.", "danger", "dns"))
        elif dns_ok:
            indicators.append(Indicator("DNS Record Found", "Domain resolves successfully.", "safe", "dns", "OK"))

    if features["has_https"] and score < 20:
        indicators.append(Indicator("HTTPS Present", "Connection uses TLS encryption.", "safe", "tls", "OK"))

    if not indicators:
        indicators.append(Indicator("No Major URL Indicators", "No high-risk URL features were detected.", "safe", "heuristic", "OK"))

    score = max(3, min(score, 100))
    metadata = {
        "features": features,
        "dns": dns_info,
        "whois": {"checked": False, "reason": "WHOIS provider not configured; feature vector uses deterministic local signals."},
        "threat_intel": {
            "phishtank": "not_configured",
            "google_safe_browsing": "not_configured",
            "cache_status": "local",
        },
    }
    return build_result("URL", url, score, indicators, metadata)


def extract_links(text: str) -> list[str]:
    links = re.findall(r"https?://[^\s\"'<>]+", text or "")
    parser = LinkExtractor()
    try:
        parser.feed(text or "")
    except Exception:
        pass
    return sorted(set(links + [href for href in parser.links if href.startswith(("http://", "https://"))]))


def parse_email(raw: str) -> dict[str, str]:
    value = raw or ""
    try:
        if "\n" in value and any(line.lower().startswith(("from:", "subject:", "to:")) for line in value.splitlines()[:10]):
            message = Parser(policy=policy.default).parsestr(value)
        else:
            message = BytesParser(policy=policy.default).parsebytes(value.encode("utf-8", errors="replace"))
    except Exception:
        return {"from": "", "to": "", "subject": "", "body": value}

    body = ""
    if message.is_multipart():
        parts = []
        for part in message.walk():
            if part.get_content_type() in {"text/plain", "text/html"}:
                try:
                    parts.append(part.get_content())
                except Exception:
                    pass
        body = "\n".join(parts)
    else:
        try:
            body = message.get_content()
        except Exception:
            body = value

    return {
        "from": str(message.get("from", "")),
        "to": str(message.get("to", "")),
        "subject": str(message.get("subject", "")),
        "body": body or value,
        "authentication_results": str(message.get("authentication-results", "")),
        "received_spf": str(message.get("received-spf", "")),
    }


def auth_header_status(parsed: dict[str, str]) -> dict[str, str]:
    combined = f"{parsed.get('authentication_results', '')} {parsed.get('received_spf', '')}".lower()
    statuses: dict[str, str] = {}
    for key in ("spf", "dkim", "dmarc"):
        if f"{key}=pass" in combined or f"{key} pass" in combined:
            statuses[key] = "pass"
        elif f"{key}=fail" in combined or f"{key} fail" in combined or f"{key}=softfail" in combined:
            statuses[key] = "fail"
        else:
            statuses[key] = "unknown"
    return statuses


def analyze_email(
    content: str,
    blacklist: set[str] | None = None,
    whitelist: set[str] | None = None,
    perform_dns: bool = False,
) -> dict[str, Any]:
    if not content or not content.strip():
        raise ValueError("Email content is required.")
    if len(content.encode("utf-8")) > 5 * 1024 * 1024:
        raise ValueError("Email content must be 5 MB or smaller.")

    parsed = parse_email(content)
    body = parsed["body"]
    lower = f"{parsed['from']} {parsed['subject']} {body}".lower()
    indicators: list[Indicator] = []
    score = 0

    urgent = sorted([word for word in URGENT_WORDS if word in lower])
    if len(urgent) >= 3:
        score += 22
        indicators.append(Indicator("Urgent or Threatening Language", "Found pressure terms: " + ", ".join(urgent[:6]), "warn", "nlp"))

    sender = parsed["from"]
    sender_domain = ""
    domain_match = re.search(r"@([a-zA-Z0-9.-]+)", sender)
    if domain_match:
        sender_domain = domain_match.group(1).lower().strip(".")
        if any(token in sender_domain for token in SCAM_TOKENS):
            score += 30
            indicators.append(Indicator("Spoofed Sender Domain", f"Sender domain {sender_domain} matches phishing patterns.", "danger"))

        display = sender.split("<", 1)[0].strip().lower()
        for brand, domain in BRANDS.items():
            if brand in display and not sender_domain.endswith(domain):
                score += 25
                indicators.append(Indicator("Display Name Mismatch", f"Sender claims {brand} but uses {sender_domain}.", "danger"))
                break

    auth_status = auth_header_status(parsed)
    failed_auth = [key.upper() for key, value in auth_status.items() if value == "fail"]
    unknown_auth = [key.upper() for key, value in auth_status.items() if value == "unknown"]
    if failed_auth:
        score += 28
        indicators.append(Indicator("Email Authentication Failed", ", ".join(failed_auth) + " failed.", "danger", "email-auth"))
    elif len(unknown_auth) == 3:
        score += 8
        indicators.append(Indicator("Authentication Headers Missing", "SPF, DKIM, and DMARC status could not be confirmed.", "warn", "email-auth"))
    else:
        indicators.append(Indicator("Authentication Headers Present", "SPF/DKIM/DMARC pass signals found in headers.", "safe", "email-auth", "OK"))

    if any(term in lower for term in ["password", "credit card", "bank account", "ssn", "social security", "pin"]):
        score += 22
        indicators.append(Indicator("Credential or Financial Request", "Message asks for sensitive personal or payment information.", "danger", "nlp"))

    links = extract_links(content)
    link_results = []
    if links:
        max_link_score = 0
        for link in links[:20]:
            try:
                link_result = analyze_url(link, blacklist=blacklist, whitelist=whitelist, perform_dns=perform_dns)
                link_results.append(
                    {
                        "url": link,
                        "risk_score": link_result["risk_score"],
                        "risk_level": link_result["risk_level"],
                    }
                )
                max_link_score = max(max_link_score, link_result["risk_score"])
            except ValueError:
                continue
        if max_link_score >= 66:
            score += 30
            indicators.append(Indicator("Malicious Link Detected", "At least one embedded link scored as PHISHING.", "danger", "url"))
        elif max_link_score >= 31:
            score += 14
            indicators.append(Indicator("Suspicious Link Detected", "At least one embedded link needs verification.", "warn", "url"))
        else:
            indicators.append(Indicator("Links Checked", f"{len(link_results)} embedded link(s) checked.", "safe", "url", "OK"))

    if "<img" in lower and "display:none" in lower:
        score += 8
        indicators.append(Indicator("Hidden HTML Content", "Message contains hidden HTML elements.", "warn", "html"))

    if not indicators:
        indicators.append(Indicator("No Major Email Indicators", "No phishing indicators were detected in the message.", "safe", "heuristic", "OK"))

    score = max(3, min(score, 100))
    metadata = {
        "sender_domain": sender_domain,
        "auth_status": auth_status,
        "link_count": len(links),
        "links": link_results,
        "nlp": {
            "urgent_word_count": len(urgent),
            "classifier": "deterministic baseline; replaceable with trained model artifact",
            "model_version": "rf-url-baseline-2026.04",
        },
    }
    return build_result("EMAIL", parsed.get("subject") or parsed.get("from") or "Email", score, indicators, metadata)


def build_result(kind: str, target: str, score: int, indicators: list[Indicator], metadata: dict[str, Any]) -> dict[str, Any]:
    level = risk_level(score)
    return {
        "analysis_id": sha_id("ana", target),
        "type": kind,
        "target": target,
        "risk_score": score,
        "risk_level": level,
        "confidence": min(0.99, round(0.62 + len(indicators) * 0.045 + score / 450, 2)),
        "indicators": [indicator.as_dict() for indicator in indicators],
        "recommended_action": recommended_action(level),
        "timestamp": now_iso(),
        "metadata": metadata,
    }


def encode_report_text(report: dict[str, Any]) -> str:
    lines = [
        "PhishGuard AI Analysis Report",
        f"Report ID: {report.get('report_id', '')}",
        f"Type: {report.get('type', '')}",
        f"Target: {report.get('target', '')}",
        f"Risk Score: {report.get('risk_score', '')}/100",
        f"Risk Level: {report.get('risk_level', '')}",
        f"Confidence: {report.get('confidence', '')}",
        f"Recommended Action: {report.get('recommended_action', '')}",
        "",
        "Indicators:",
    ]
    for item in report.get("indicators", []):
        lines.append(f"- {item.get('level', '').upper()}: {item.get('title', '')} - {item.get('desc', '')}")
    return "\n".join(lines)


def pseudo_pdf_bytes(report: dict[str, Any]) -> bytes:
    # Minimal PDF-like artifact for local development. Production can swap this for Cloud Storage PDF generation.
    text = encode_report_text(report).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 10 Tf 50 780 Td ({text[:3500].replace(chr(10), ') Tj T* (')}) Tj ET"
    objects = [
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(stream)} >> stream\n{stream}\nendstream endobj",
    ]
    body = "%PDF-1.4\n" + "\n".join(objects) + "\ntrailer << /Root 1 0 R >>\n%%EOF\n"
    return body.encode("utf-8")


def decode_demo_token(token: str | None) -> dict[str, Any]:
    if not token:
        return {"uid": "anonymous", "email": "", "role": "visitor"}
    if token.startswith("demo-admin"):
        return {"uid": "demo-admin", "email": "admin@phishguard.ai", "role": "admin"}
    if token.startswith("demo-user"):
        return {"uid": "demo-user", "email": "user@demo.com", "role": "user"}
    parts = token.split(".")
    if len(parts) >= 2:
        try:
            padded = parts[1] + "=" * (-len(parts[1]) % 4)
            payload = base64.urlsafe_b64decode(padded.encode("ascii"))
            import json

            data = json.loads(payload)
            return {
                "uid": data.get("user_id") or data.get("sub") or "firebase-user",
                "email": data.get("email", ""),
                "role": data.get("role", "user"),
            }
        except Exception:
            pass
    return {"uid": "api-user", "email": "", "role": "user"}
