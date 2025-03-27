from typing import Tuple
import time

class Node:
    def __init__(self):
        self.instantiated = True
        print(f"Node initialized {self.__class__.__name__}")
        self.send_message = lambda msg: None
        self.text_widgets = []
        self.number_widgets = []

    def run(self, *args, **kwargs):
        pass

    def _run(self, *args, **kwargs):
        result = self.run(*args, **kwargs)
        if isinstance(result, tuple):
            self.output_results = list(result)
        else:
            self.output_results = [result]

class Foo(Node):
    def run(self):
        time.sleep(1)
        first = self.text_widgets[0]
        second = self.text_widgets[1]
        yes = self.number_widgets[0]
        no = self.number_widgets[1]
        print(f"Yes: {yes}")
        print(f"No: {no}")
        FooOutput = first
        FooOutput2 = second

        self.send_message("Testing")

        return FooOutput, FooOutput2

class Bar(Node):
    def run(self, BarInput: str, BarInput2: str) -> Tuple[str, str]:
        time.sleep(2)
        BarOutput = BarInput[::-1]
        BarOutput2 = BarInput2[::-1]

        print(f"{BarOutput} and {BarOutput2}")

        return BarOutput, BarOutput2

class OllamaQuery(Node):
    def run(self, model: str, system_message: str, prompt: str, host: str, port: str, temperature: str, seed: str) -> Tuple[str, str]:
        from ollama_query import ollama_query
        model_text = self.text_widgets[0]
        system_message_text = self.text_widgets[1]
        prompt_text = self.text_widgets[2]
        host_text = self.text_widgets[3]
        port_text = self.text_widgets[4]
        temperature_text = self.text_widgets[5]
        seed_text = self.text_widgets[6]

        if system_message_text == "":
            system_message_text = None

        if temperature_text == "":
            temperature_text = None

        if seed_text == "":
            print("SETTING SEED TO NONE")
            seed_text = None

        response, debug_text = ollama_query(model=model_text, prompt=prompt_text, system_message=system_message_text, host=host_text, port=port_text, temperature=temperature_text)

        return (response, debug_text)
