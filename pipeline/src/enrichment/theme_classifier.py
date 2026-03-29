import json
import re
import anthropic

VALID_THEME_SLUGS = [
    "constitution",
    "droit-public",
    "droit-administratif",
    "droit-commercial",
    "droit-affaires",
    "droit-civil",
    "droit-penal",
    "droit-foncier",
    "droit-travail",
    "droit-social",
    "droit-famille",
    "droit-sante",
    "droit-education",
    "droit-fiscal",
    "droit-douanier",
    "droit-bancaire",
    "droit-maritime",
    "droit-aerien",
    "droit-numerique",
    "droit-telecommunications",
    "droit-propriete-intellectuelle",
    "droit-investissement",
    "environnement",
    "forets-biodiversite",
    "eau-assainissement",
    "mines-ressources",
    "energie-electrique",
    "agriculture",
    "elevage",
    "peche-aquaculture",
    "securite-alimentaire",
    "urbanisme-construction",
    "transport-infrastructure",
    "tourisme",
    "culture-patrimoine",
    "sport",
    "media-presse",
    "securite-defense",
    "relations-internationales",
    "integration-regionale",
    "droits-humains",
    "genre-egalite",
]


class ThemeClassifier:
    def __init__(self, api_key: str | None = None):
        self.client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    def build_prompt(self, title: str, text: str) -> str:
        truncated_text = text[:3000] if text else ""
        valid_slugs_str = "\n".join(f"- {slug}" for slug in VALID_THEME_SLUGS)

        return f"""Tu es un expert en droit francophone. Analyse le document juridique suivant et identifie les thèmes juridiques pertinents.

Titre: {title}

Extrait du texte:
{truncated_text}

Voici la liste des thèmes valides (utilise uniquement ces slugs):
{valid_slugs_str}

Réponds UNIQUEMENT avec un objet JSON contenant une clé "themes" avec une liste de slugs pertinents.
Exemple: {{"themes": ["droit-foncier", "environnement", "agriculture"]}}

Sélectionne entre 1 et 5 thèmes les plus pertinents. Ne retourne que le JSON, sans texte supplémentaire."""

    def parse_response(self, response: str) -> list[str]:
        # Try to extract JSON from the response
        try:
            # Look for JSON object in the response
            json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                themes = data.get("themes", [])
                if isinstance(themes, list):
                    # Filter to only valid slugs
                    return [t for t in themes if t in VALID_THEME_SLUGS]
        except (json.JSONDecodeError, AttributeError):
            pass

        return []

    async def classify(self, title: str, text: str) -> list[str]:
        prompt = self.build_prompt(title, text)

        message = self.client.messages.create(
            model="claude-opus-4-5",
            max_tokens=256,
            messages=[
                {"role": "user", "content": prompt},
            ],
        )

        response_text = message.content[0].text
        return self.parse_response(response_text)
