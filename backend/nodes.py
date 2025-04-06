from typing import Tuple
import asyncio


class Node:
    def __init__(self):
        self.instantiated = True
        self.node_id = None
        print(f"Node initialized {self.__class__.__name__}")
        self.widgets = []
        self.websocket = None

    async def send_message(self, message_type: str, data: dict):
        if self.websocket:
            await self.websocket.send_json(
                {
                    "type": "node_message",
                    "data": {
                        "nodeId": self.node_id,
                        "message": {"type": message_type, "data": data},
                    },
                }
            )

    async def set_status(self, status):
        """Update node's running status"""
        await self.send_message("status", status)

    async def update_widget(self, widget_name, value):
        """Update a widget's value during node execution"""
        await self.send_message("widget_update", {"name": widget_name, "value": value})

    async def run(self, *args, **kwargs):
        pass

    async def _run(self, *args, **kwargs):
        await self.set_status("run_start")
        result = await self.run(*args, **kwargs)
        await self.set_status("run_complete")
        if isinstance(result, (tuple, list)):
            return result
        return [result] if result is not None else []


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


class ShowText(Node):
    async def run(self, text: str) -> str:
        display_text = self.widgets[0]  # {"type": "textarea", "value": ""}
        await self.update_widget("display_text", text)
        return display_text


class ShowImage(Node):
    async def run(self) -> str:
        test = self.widgets[0]  # {"type": "image", "value": ""}
        return test


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


class GrayscaleImage(Node):
    async def run(self, input_image: str) -> str:
        from PIL import Image
        import base64
        from io import BytesIO

        # Extract the base64 data from the data URL
        base64_data = input_image.split(",")[1]

        # Convert base64 to PIL Image
        image_data = base64.b64decode(base64_data)
        img = Image.open(BytesIO(image_data))

        # Convert to grayscale
        grayscale_img = img.convert("L")

        # Convert back to base64
        buffered = BytesIO()
        grayscale_img.save(buffered, format="PNG")
        base64_str = base64.b64encode(buffered.getvalue()).decode()
        img_str = f"data:image/png;base64,{base64_str}"

        # Update the widget with the grayscale image
        display_image = self.widgets[0]  # {"type": "image", "value": ""}
        await self.update_widget("display_image", img_str)

        return img_str
