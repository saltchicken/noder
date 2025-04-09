from typing import Tuple
import asyncio

from node_utils import Node


class OllamaQuery(Node):
    async def run(self) -> Tuple[str, str]:
        from ollama_query import ollama_query

        model_text = self.widgets[0]
        system_message_text = self.widgets[1]
        prompt_text = self.widgets[2]
        host_text = self.widgets[3]
        port_text = self.widgets[4]
        temperature_text = self.widgets[5]
        seed_text = self.widgets[6]

        if system_message_text == "":
            system_message_text = None

        if temperature_text == "":
            temperature_text = None

        if seed_text == "":
            seed_text = None

        response, debug_text = ollama_query(
            model=model_text,
            prompt=prompt_text,
            system_message=system_message_text,
            host=host_text,
            port=port_text,
            temperature=temperature_text,
        )

        return (response, debug_text)
