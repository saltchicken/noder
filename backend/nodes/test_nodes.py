from typing import Tuple
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


class TestImageEdit(Node):
    async def run(self) -> str:
        from PIL import Image, ImageDraw
        import base64
        from io import BytesIO

        img = Image.new("RGB", (200, 200), color="white")
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 150, 150], fill="red")

        buffered = BytesIO()
        img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)
        return img_str


class MultiInputNode(Node):
    async def run(self, input_values: Union[str, List[str]]) -> str:
        # Handle both single value and list of values
        if isinstance(input_values, list):
            print("This was a list")
            input_values = " ".join(input_values)
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", input_values)
