from typing import Tuple, Union, List
import asyncio

from node_utils import Node


class Foo(Node):
    async def run(self) -> Tuple[str, int]:
        first = self.widgets[0]
        second = self.widgets[
            1
        ]  # {"type": "slider", "min": 0, "max": 100, "step": 1, "value": 20 }
        yes = self.widgets[2]  # { "value": "hello" }
        no = self.widgets[3]
        new = self.widgets[4]  # {"type": "dropdown", "options": ["1", "2", "3"]}
        await asyncio.sleep(2)  # Wait 2 seconds
        new_no = no[::-1]
        await self.update_widget("no", new_no)
        FooOutput = first
        FooOutput2 = second

        return FooOutput, FooOutput2


class Bar(Node):
    async def run(self, BarInput: str, BarInput2: str) -> Tuple[str, str]:
        BarOutput = BarInput[::-1]
        BarOutput2 = BarInput2[::-1]
        test_test = self.widgets[0]

        return BarOutput, BarOutput2
