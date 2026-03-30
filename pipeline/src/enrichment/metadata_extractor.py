import json
import re
import anthropic


class MetadataExtractor:
    def __init__(self, api_key: str | None = None):
        self.client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    def build_prompt(self, title: str, text: str) -> str:
        truncated_text = text[:3000] if text else ""

        return f"""Tu es un expert en droit francophone. Analyse le document juridique suivant et extrais les métadonnées structurées.

Titre: {title}

Extrait du texte:
{truncated_text}

Extrais les métadonnées suivantes si disponibles:
- numero: numéro du texte (loi, décret, ordonnance, etc.)
- date_signature: date de signature/promulgation (format YYYY-MM-DD si possible)
- date_publication: date de publication au journal officiel (format YYYY-MM-DD si possible)
- journal_officiel: référence du journal officiel
- signataire: autorité signataire (président, ministre, etc.)
- type_texte: type de texte. Valeurs possibles UNIQUEMENT: constitution, loi_organique, loi, ordonnance, decret, arrete, traite, acte_uniforme
- institution: institution émettrice
- mots_cles: liste de mots-clés pertinents (max 10)

Réponds UNIQUEMENT avec un objet JSON. Utilise null pour les valeurs non trouvées.
Exemple:
{{
  "numero": "2020-15",
  "date_signature": "2020-06-15",
  "date_publication": "2020-07-01",
  "journal_officiel": "JO n°45 du 1er juillet 2020",
  "signataire": "Président de la République",
  "type_texte": "loi",
  "institution": "Assemblée Nationale",
  "mots_cles": ["élevage", "agriculture", "Bénin"]
}}

Ne retourne que le JSON, sans texte supplémentaire."""

    def parse_response(self, response: str) -> dict:
        try:
            # Try to find a JSON object in the response
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}', response, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                # Ensure expected keys exist, default to None if missing
                expected_keys = [
                    "numero", "date_signature", "date_publication",
                    "journal_officiel", "signataire", "type_texte",
                    "institution", "mots_cles",
                ]
                result = {}
                for key in expected_keys:
                    result[key] = data.get(key)
                return result
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "numero": None,
            "date_signature": None,
            "date_publication": None,
            "journal_officiel": None,
            "signataire": None,
            "type_texte": None,
            "institution": None,
            "mots_cles": None,
        }

    async def extract(self, title: str, text: str) -> dict:
        prompt = self.build_prompt(title, text)

        message = self.client.messages.create(
            model="claude-sonnet-4-5-20241022",
            max_tokens=512,
            messages=[
                {"role": "user", "content": prompt},
            ],
        )

        response_text = message.content[0].text
        return self.parse_response(response_text)
