from typing import Tuple
from message_queue import message_queue

class Node:
    def __init__(self):
        self.instantiated = True
        print(f"Node initialized {self.__class__.__name__}")
        self.widgets = []

    def send_message(self, message):
        message_queue.put(message)

    def run(self, *args, **kwargs):
        pass

    def _run(self, *args, **kwargs):
        result = self.run(*args, **kwargs)
        # Don't wrap the result in a list if it's already a tuple/list
        if isinstance(result, (tuple, list)):
            return result
        # Wrap single values in a list
        return [result] if result is not None else []

class Foo(Node):
    def run(self):
        first = self.widgets[0]
        second = self.widgets[1] # {"type": "slider", "min": 0, "max": 100, "step": 1, "value": 20 }
        yes = self.widgets[2] # { "value": "hello" }
        no = self.widgets[3]
        new = self.widgets[4] # {"type": "dropdown", "options": ["1", "2", "3"]}
        FooOutput = first
        FooOutput2 = second

        # self.send_message("Testing")

        return FooOutput, FooOutput2

class Bar(Node):
    def run(self, BarInput: str, BarInput2: str) -> Tuple[str, str]:
        BarOutput = BarInput[::-1]
        BarOutput2 = BarInput2[::-1]
        test_test = self.widgets[0]

        return BarOutput, BarOutput2

class OllamaQuery(Node):
    def run(self) -> Tuple[str, str]:
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

        response, debug_text = ollama_query(model=model_text, prompt=prompt_text, system_message=system_message_text, host=host_text, port=port_text, temperature=temperature_text)

        return (response, debug_text)

class ShowText(Node):
    def run(self, text: str) -> str:
        what_to_name = self.widgets[0]
        self.send_message({'name': "what_to_name", "value": text})
        display_text = text
        return display_text
