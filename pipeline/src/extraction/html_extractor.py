from bs4 import BeautifulSoup

TAGS_TO_REMOVE = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    "noscript",
    "iframe",
    "form",
    "button",
    "input",
    "select",
    "textarea",
    "meta",
    "link",
]


class HtmlExtractor:
    def extract_text(self, html: str) -> str:
        soup = BeautifulSoup(html, "lxml")

        # Remove unwanted tags
        for tag in TAGS_TO_REMOVE:
            for element in soup.find_all(tag):
                element.decompose()

        # Get text with reasonable separator
        text = soup.get_text(separator="\n", strip=True)

        # Collapse excessive blank lines
        import re
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()
