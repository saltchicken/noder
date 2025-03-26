from typing import Tuple

class Node:
    def run(self, *args, **kwargs):
        pass

    def _run(self, *args, **kwargs):
        result = self.run(*args, **kwargs)
        if isinstance(result, tuple):
            self.output_results = list(result)
        else:
            self.output_results = [result]

class Foo(Node):
    def __init__(self):
        self.instantiated = True
        print("Foo initialized")

    def run(self):
        test_text = self.widget_values[0]
        FooOutput = test_text
        FooOutput2 = "FooOutput2"

        return FooOutput, FooOutput2

class Bar(Node):
    def __init__(self):
        self.instantiated = True
        print("Bar initialized")

    def run(self, BarInput: str, BarInput2: str) -> Tuple[str, str]:
        BarOutput = BarInput[::-1]
        BarOutput2 = BarInput2[::-1]

        print(f"{BarOutput} and {BarOutput2}")

        return BarOutput, BarOutput2
